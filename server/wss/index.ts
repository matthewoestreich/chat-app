import { WebSocket, ServerOptions } from "ws";
import jsonwebtoken from "jsonwebtoken";
import errorCodeToReason, { WEBSOCKET_ERROR_CODE } from "./websocketErrorCodes";
import parseCookies from "./parseCookies";
import isAuthenticated from "./isAuthenticated";
import WebSocketApp from "./WebSocketApp";

import Logger from "@/server/Logger";

const logger = new Logger("WebSocketApp");
// eslint-disable-next-line
const logInfo = (message: string, data?: any): void => logger.log({ level: "info", message, data });
// eslint-disable-next-line
const logWarn = (message: string, data?: any): void => logger.log({ level: "warn", message, data });
// eslint-disable-next-line
const logError = (message: string, data?: any): void => logger.log({ level: "error", message, data });

const wsapp = new WebSocketApp();

export default async function startWebSocketApp(options: ServerOptions, databaseProvider: DatabaseProvider): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      wsapp.databaseProvider = databaseProvider;
      wsapp.listen(options, resolve);
    } catch (e) {
      reject(e);
    }
  });
}

// Catch any errors.
wsapp.catch((error: Error, socket: WebSocket) => {
  logError(`Something went wrong!`, { error });
  console.error({ error, user: socket.user! });
});

/**
 *
 * @event {CONNECTION_ESTABLISHED}
 *
 * CONNECTION_ESTABLISHED fires when a socket first connects to this server.
 * It's kind of like an "initial connection" event.
 *
 */
wsapp.on("CONNECTION_ESTABLISHED", async (client, { request }) => {
  logInfo("CONNECTION_ESTABLISHED");
  const cookies = parseCookies(request.headers.cookie || "");

  if (!(await isAuthenticated(cookies?.session))) {
    const { code, definition } = WEBSOCKET_ERROR_CODE.Unauthorized;
    return client.socket.close(code, definition);
  }

  client.user = jsonwebtoken.decode(cookies.session) as Account;
  const rooms = await wsapp.databaseProvider.rooms.selectByUserId(client.user.id);
  client.send("LIST_ROOMS", { rooms });
  rooms.forEach((room) => wsapp.addContainerToCache(room.id));
  const container = wsapp.addClientToCache(client, WebSocketApp.ID_UNASSIGNED);
  client.setActiveIn(WebSocketApp.ID_UNASSIGNED, container);
});

/**
 *
 * @event {CONNECTION_CLOSED}
 *
 * CONNECTION_CLOSED fires when a socket is closed. This allows us to clean up and
 * log the reason for socket closure.
 *
 */
wsapp.on("CONNECTION_CLOSED", (client, { code, reason }) => {
  if (client.activeIn?.container) {
    client.broadcast("MEMBER_LEFT_ROOM", { id: client.user.id });
    wsapp.deleteCachedItem(client.user.id, client.activeIn.id);
  }
  const reasonString = reason.toString();
  const why = reasonString === "" ? errorCodeToReason(code) : { reason: reasonString, definition: "" };
  logInfo("Connection closed!", { why });
});

/**
 *
 * @event {SEND_MESSAGE}
 *
 * Someone is sending a chat message to a room.
 *
 */
wsapp.on("SEND_MESSAGE", async (client, { message }) => {
  logInfo("Send message", { message });
  client.broadcast("RECEIVE_MESSAGE", {
    userId: client.user.id,
    userName: client.user.name,
    message,
  });

  try {
    const { messageId, userName, message: newMessage } = await wsapp.databaseProvider.roomMessages.create(client.activeIn.id, client.user.id, client.user.name, message);
    client.send("SENT_MESSAGE", { message: { messageId, message: newMessage, userName } });
  } catch (e) {
    console.error(`[ERROR] TODO : handle this error better! From SEND_MESSAGE :`, e);
  }
});

/**
 *
 * @event {GET_ROOM}
 *
 */
wsapp.on("GET_ROOMS", async (client) => {
  const rooms = await wsapp.databaseProvider.rooms.selectByUserId(client.user.id);
  client.send("LIST_ROOMS", { rooms });
  rooms.forEach((room) => wsapp.addContainerToCache(room.id));
  const container = wsapp.addClientToCache(client, WebSocketApp.ID_UNASSIGNED);
  client.setActiveIn(WebSocketApp.ID_UNASSIGNED, container);
});

/**
 *
 * @event {ENTER_ROOM}
 *
 * ENTER_ROOM is for when a user enters an already joined room.
 * JOIN_ROOM is used when a user has joined a room they were not a member of prior.
 *
 */
wsapp.on("ENTER_ROOM", async (client, { id }) => {
  // Notify existing room (which user is now leaving) that user is leaving.
  if (client.activeIn) {
    client.broadcast("MEMBER_LEFT_ROOM", { id: client.user.id });
    wsapp.deleteCachedItem(client.user.id, client.activeIn.id);
  }

  const container = wsapp.addClientToCache(client, id);
  client.setActiveIn(id, container);
  client.broadcast("MEMBER_ENTERED_ROOM", { id: client.user.id });

  try {
    const room = await wsapp.databaseProvider.rooms.getById(id);
    const members = await wsapp.databaseProvider.rooms.selectRoomMembersExcludingUser(id, client.user.id);
    const messages = (await wsapp.databaseProvider.roomMessages.selectByRoomId(id)) as PublicMessage[];
    client.send("ENTERED_ROOM", {
      messages,
      // Add `isActive` property for each user in this room based upon if they're cached in this room.
      members: members.map((m) => ({ ...m, isActive: wsapp.getCachedContainer(id)!.has(m.userId) })),
      room,
    });
  } catch (e) {
    console.error(`[ERROR] TODO : handle this error better! From ENTER_ROOM :`, e);
  }
});

/**
 *
 * @event {JOIN_ROOM}
 *
 * JOIN_ROOM is used when a user has joined a room they were not a member of prior.
 * ENTER_ROOM is for when a user enters an already joined room.
 *
 */
wsapp.on("JOIN_ROOM", async (client, { id }) => {
  try {
    logInfo("Join room", { user: client.user, roomId: id });
    await wsapp.databaseProvider.rooms.addUserToRoom(client.user.id, id);
    const rooms = await wsapp.databaseProvider.rooms.selectByUserId(client.user.id);
    client.send("JOINED_ROOM", { rooms });
  } catch (e) {
    client.send("JOIN_ROOM", { error: e as Error, id: "" });
  }
});

/**
 *
 * @event {UNJOIN_ROOM}
 *
 * UNJOIN_ROOM is named "unjoin" as to not cause confusion with "enter" or "leave/left".
 * UNJOIN_ROOM fires when a user has removed a room from their "memberships", if you will.
 * (NOTE: a "membership" isn't a term/keyword/concept that exists in this app, just using the term for explanation)
 * `*_(LEAVE|LEFT)_*` events are different as the user has just "exited" the chat room.
 *
 */
wsapp.on("UNJOIN_ROOM", async (client, { id }) => {
  try {
    if (!(await wsapp.databaseProvider.rooms.removeUserFromRoom(client.user.id, id))) {
      throw new Error("Something went wrong while removing.");
    }

    client.send("UNJOINED_ROOM", { rooms: await wsapp.databaseProvider.rooms.selectByUserId(client.user.id) });

    // Covers the case for when a user unjoins a room they are currently chatting in.
    if (client.activeIn.container && client.activeIn.id === id) {
      client.broadcast("MEMBER_LEFT_ROOM", { id: client.user.id });
      wsapp.deleteCachedItem(client.user.id, client.activeIn.id);
    }
  } catch (e) {
    client.send("UNJOINED_ROOM", { error: e as Error, rooms: [] });
  }
});

/**
 *
 * @event {CREATE_ROOM}
 *
 * Creates a new room. The creator of the room is auto-joined.
 *
 */
wsapp.on("CREATE_ROOM", async (client, { name, isPrivate }) => {
  if (isPrivate === undefined) {
    isPrivate = false;
  }

  try {
    const room = await wsapp.databaseProvider.rooms.create(name, isPrivate === true ? 1 : 0);
    await wsapp.databaseProvider.rooms.addUserToRoom(client.user.id, room.id);
    const rooms = await wsapp.databaseProvider.rooms.selectByUserId(client.user.id);
    client.send("CREATED_ROOM", { id: room.id, rooms });
    wsapp.addContainerToCache(room.id);
  } catch (e) {
    client.send("CREATED_ROOM", { error: e as Error, id: "", rooms: [] });
  }
});

/**
 *
 * @event {GET_JOINABLE_ROOMS}
 *
 * Gets all rooms that a user is not already a member of.
 *
 */
wsapp.on("GET_JOINABLE_ROOMS", async (client) => {
  try {
    client.send("LIST_JOINABLE_ROOMS", { rooms: await wsapp.databaseProvider.rooms.selectUnjoinedRooms(client.user.id) });
  } catch (e) {
    client.send("LIST_JOINABLE_ROOMS", { error: e as Error, rooms: [] });
  }
});

/**
 *
 * @event {GET_DIRECT_CONVERSATIONS}
 *
 * Gets all direct conversations (DMs) that a user is currently in.
 *
 */
wsapp.on("GET_DIRECT_CONVERSATIONS", async (client) => {
  try {
    const directConversations = await wsapp.databaseProvider.directConversations.selectByUserId(client.user.id);
    client.send("LIST_DIRECT_CONVERSATIONS", { directConversations: directConversations.map((c) => ({ ...c, isActive: wsapp.isItemCached(c.id) })) });
  } catch (e) {
    client.send("LIST_DIRECT_CONVERSATIONS", { error: e as Error, directConversations: [] });
  }
});

/**
 *
 * @event {GET_DIRECT_MESSAGES}
 *
 * Gets all messages in a direct conversation.
 *
 */
wsapp.on("GET_DIRECT_MESSAGES", async (client, { id }) => {
  try {
    const messages = await wsapp.databaseProvider.directMessages.selectByDirectConversationId(id);

    if (client.user.id !== messages[0].fromUserId && client.user.id !== messages[0].toUserId) {
      const errMsg = `[wsapp][LIST_DIRECT_MESSAGES] Possible spoof : socket.user.id does not match either direct conversation member.`;
      const errData = { members: [messages[0].fromUserId, messages[0].toUserId], socket: client.socket };
      return console.log(errMsg, errData);
    }

    client.send("LIST_DIRECT_MESSAGES", { directMessages: messages });
  } catch (e) {
    client.send("LIST_DIRECT_MESSAGES", { error: e as Error, directMessages: [] });
  }
});

/**
 *
 * @event {GET_INVITABLE_USERS}
 *
 * Gets all users you are not currently in a direct conversation with..
 *
 */
wsapp.on("GET_INVITABLE_USERS", async (client) => {
  try {
    const users = await wsapp.databaseProvider.directConversations.selectInvitableUsersByUserId(client.user.id);

    client.send("LIST_INVITABLE_USERS", {
      // Add `isActive` field for each user
      users: users.map((u) => ({ ...u, isActive: wsapp.isItemCached(u.id) })),
    });
  } catch (e) {
    client.send("LIST_INVITABLE_USERS", { error: e as Error, users: [] });
  }
});
