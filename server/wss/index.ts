import { WebSocket, ServerOptions } from "ws";
import jsonwebtoken from "jsonwebtoken";
import { /*errorCodeToReason,*/ WEBSOCKET_ERROR_CODE } from "./websocketErrorCodes";
import parseCookies from "./parseCookies";
import isAuthenticated from "./isAuthenticated";
import WebSocketApp from "./WebSocketApp";
import { DatabaseProvider } from "../types";
import { DirectMessage, Message, PublicMessage, Room } from "@root/types.shared";

const wsapp = new WebSocketApp();

export default async function startWebSocketApp<T>(options: ServerOptions, databaseProvider: DatabaseProvider<T>): Promise<void> {
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
  const cookies = parseCookies(request.headers.cookie || "");

  if (!(await isAuthenticated(cookies?.session))) {
    const { code, definition } = WEBSOCKET_ERROR_CODE.Unauthorized;
    return client.socket.close(code, definition);
  }

  client.user = jsonwebtoken.decode(cookies.session) as AuthenticatedUser;
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
wsapp.on("CONNECTION_CLOSED", (client /*{ reason, code }*/) => {
  client.broadcast("USER_DISCONNECTED", { userId: client.user.id });
  wsapp.deleteCachedItem(client.user.id, client.activeIn.id);
  //const reasonString = reason.toString();
  //const why = reasonString === "" ? errorCodeToReason(code) : { reason: reasonString, definition: "" };
  //console.log(`${client.user.userName} ${client.user.id} closed connection`, why);
});

/**
 *
 * @event {SEND_MESSAGE}
 *
 * Someone is sending a chat message to a room.
 *
 */
wsapp.on("SEND_MESSAGE", async (client, { message, scope }) => {
  try {
    let publicMessage: PublicMessage | null = null;
    let sentMessage: Message | DirectMessage | null = null;

    if (scope.type === "Room") {
      client.broadcast("RECEIVE_MESSAGE", { userId: client.user.id, userName: client.user.userName, message });
      sentMessage = await wsapp.databaseProvider.roomMessages.create(client.activeIn.id, client.user.id, message);
      publicMessage = {
        scopeId: sentMessage.scopeId,
        userId: client.user.id,
        timestamp: sentMessage.timestamp,
        message: sentMessage.message,
        id: sentMessage.id,
        userName: client.user.userName,
      };
    } else if (scope.type === "DirectConversation") {
      sentMessage = await wsapp.databaseProvider.directMessages.create(scope.id, client.user.id, scope.userId, message);
      publicMessage = {
        message: sentMessage.message,
        id: sentMessage.id,
        scopeId: sentMessage.scopeId,
        timestamp: sentMessage.timestamp,
        userId: client.user.id,
        // TODO gather userName!
        userName: "YOU STILL NEED TO FIX THIS",
      };
    }

    if (publicMessage === null) {
      return client.send("SENT_MESSAGE", { error: new Error(`Scope '${scope.type}' is unrecognized.`), message: {} as PublicMessage });
    }

    client.send("SENT_MESSAGE", { message: publicMessage });
  } catch (e) {
    console.error(`[ERROR] TODO : handle this error better! From SEND_MESSAGE :`, e);
    client.send("SENT_MESSAGE", { error: e as Error, message: {} as PublicMessage });
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
    const messages = await wsapp.databaseProvider.roomMessages.selectByRoomId(id);

    client.send("ENTERED_ROOM", {
      room,
      messages,
      // Add `isActive` property for each user in this room based upon if they're cached in this room.
      members: members.map((m) => ({
        userName: m.userName,
        userId: m.userId,
        scopeId: m.scopeId,
        isActive: wsapp.getCachedContainer(id)!.has(m.userId),
      })),
    });
  } catch (e) {
    console.error(`[ERROR] TODO : handle this error better! From ENTER_ROOM :`, e);
    client.send("ENTERED_ROOM", { error: e as Error, members: [], messages: [], room: {} as Room });
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
    client.send("LIST_DIRECT_CONVERSATIONS", { directConversations: directConversations.map((c) => ({ ...c, isActive: wsapp.isItemCached(c.userId) })) });
  } catch (e) {
    client.send("LIST_DIRECT_CONVERSATIONS", { error: e as Error, directConversations: [] });
  }
});

/**
 *
 * @event {JOIN_DIRECT_CONVERSATION}
 *
 * Create a new direct conversation with someone
 *
 */
wsapp.on("JOIN_DIRECT_CONVERSATION", async (client, { withUserId }) => {
  try {
    const { create, selectByUserId, selectInvitableUsersByUserId } = wsapp.databaseProvider.directConversations;

    const newDirectConvo = await create(client.user.id, withUserId);
    const directConvos = await selectByUserId(client.user.id);
    const invitableUsers = await selectInvitableUsersByUserId(client.user.id);

    client.send("JOINED_DIRECT_CONVERSATION", {
      invitableUsers: invitableUsers.map((u) => ({ ...u, isActive: wsapp.isItemCached(u.userId) })),
      directConversations: directConvos.map((c) => ({ ...c, isActive: wsapp.isItemCached(c.userId) })),
      directConversationId: newDirectConvo.id,
    });
  } catch (e) {
    client.send("JOINED_DIRECT_CONVERSATION", { error: e as Error, directConversationId: "", directConversations: [], invitableUsers: [] });
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

    if (messages && messages.length && client.user.id !== messages[0].fromUserId && client.user.id !== messages[0].toUserId) {
      const errMsg = `[wsapp][LIST_DIRECT_MESSAGES] Possible spoof : socket.user.id does not match either direct conversation member.`;
      const errData = { members: [messages[0].fromUserId, messages[0].toUserId], socket: client.socket };
      return console.log(errMsg, errData);
    }

    client.send("LIST_DIRECT_MESSAGES", { directMessages: messages });
  } catch (e) {
    console.log(e);
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
      users: users.map((u) => ({ ...u, isActive: wsapp.isItemCached(u.userId) })),
    });
  } catch (e) {
    client.send("LIST_INVITABLE_USERS", { error: e as Error, users: [] });
  }
});
