import { IncomingMessage, Server, ServerResponse } from "node:http";
import { WebSocket } from "ws";
import jsonwebtoken from "jsonwebtoken";
import { v7 as uuidV7 } from "uuid";
import { chatService, directConversationService, directMessagesService, messagesService, roomService } from "@/server/db/services/index";
import SQLitePool from "@/server/db/SQLitePool";
import errorCodeToReason, { WEBSOCKET_ERROR_CODE } from "./websocketErrorCodes";
import parseCookies from "./parseCookies";
import isAuthenticated from "./isAuthenticated";
import WebSocketApp from "./WebSocketApp";

const DB_POOL = new SQLitePool(process.env.ABSOLUTE_DB_PATH!, 5);
const wsapp = new WebSocketApp();

export default function startWebSocketApp(server: Server<typeof IncomingMessage, typeof ServerResponse>, callback?: () => void): void {
  wsapp.listen({ server }, callback);
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

  client.user = jsonwebtoken.decode(cookies.session) as Account;

  const { db, release } = await DB_POOL.getConnection();
  const rooms = await chatService.selectRoomsByUserId(db, client.user.id);

  release();

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
wsapp.on("CONNECTION_CLOSED", (client, _payload) => {
  if (client.activeIn.container) {
    client.broadcast("MEMBER_LEFT_ROOM", { id: client.user.id });
    wsapp.deleteCachedItem(client.user.id, client.activeIn.id);
  }
  //const reasonString = reason.toString();
  //const why = reasonString === "" ? errorCodeToReason(code) : { reason: reasonString, definition: "" };
  //console.log(`socket closed.`, { user: client.user, code, why });
});

/**
 *
 * @event {SEND_MESSAGE}
 *
 * Someone is sending a chat message to a room.
 *
 */
wsapp.on("SEND_MESSAGE", async (client, { message }) => {
  client.broadcast("RECEIVE_MESSAGE", {
    userId: client.user.id,
    userName: client.user.name,
    message,
  });

  const { db, release } = await DB_POOL.getConnection();

  try {
    // No need to await this, we don't need a response, and nothing depends on the result.
    messagesService.insertMessage(db, client.activeIn.id, client.user.id, message);
    release();
  } catch (e) {
    release();
  }
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

  const { db, release } = await DB_POOL.getConnection();

  try {
    let members = await chatService.selectRoomMembersExcludingUser(db, id, client.user.id);
    const messages = await messagesService.selectByRoomId(db, id);

    release();

    // Add `isActive` property for each user in this room based upon if they're cached in this room.
    members = members.map((m) => ({ ...m, isActive: wsapp.getCachedContainer(id)!.has(m.userId) }));

    client.send("ENTERED_ROOM", { members, messages });
  } catch (e) {
    release();
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
  const user = client.user;
  const { db, release } = await DB_POOL.getConnection();

  try {
    const rooms = await chatService.addUserByIdToRoomById(db, user.id, id, true);
    release();
    client.send("JOINED_ROOM", { rooms });
  } catch (e) {
    release();
    client.send("ERROR", { event: "JOIN_ROOM", error: e as Error });
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
  const { db, release } = await DB_POOL.getConnection();

  try {
    if (!(await chatService.deleteRoomMember(db, id, client.user.id))) {
      throw new Error("Something went wrong while removing.");
    }

    const rooms = await chatService.selectRoomsByUserId(db, client.user.id);
    release();

    client.send("LIST_ROOMS", { rooms });

    // Covers the case for when a user unjoins a room they are currently chatting in.
    if (client.activeIn.container && client.activeIn.id === id) {
      client.broadcast("MEMBER_LEFT_ROOM", { id: client.user.id });
      wsapp.deleteCachedItem(client.user.id, client.activeIn.id);
    }
  } catch (e) {
    release();
    client.send("ERROR", { event: "UNJOIN_ROOM", error: e as Error });
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
  const user = client.user;
  const { db, release } = await DB_POOL.getConnection();

  if (isPrivate === undefined) {
    isPrivate = false;
  }

  try {
    const room = await roomService.insert(db, name, uuidV7(), isPrivate === true ? 1 : 0);
    const rooms = await chatService.addUserByIdToRoomById(db, user.id, room.id, true);
    release();
    client.send("CREATED_ROOM", { id: room.id, rooms });
    wsapp.addContainerToCache(room.id);
  } catch (e) {
    release();
    client.send("ERROR", { event: "CREATE_ROOM", error: e as Error });
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
  const user = client.user;
  const { db, release } = await DB_POOL.getConnection();

  try {
    const rooms = await roomService.selectUnjoinedRooms(db, user.id);
    release();
    client.send("LIST_JOINABLE_ROOMS", { rooms });
  } catch (e) {
    release();
    client.send("ERROR", { event: "LIST_JOINABLE_ROOMS", error: e as Error });
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
  const user = client.user;
  const { db, release } = await DB_POOL.getConnection();

  try {
    const dc = await directConversationService.selectAllByUserId(db, user.id);
    release();
    const directConversations = dc.map((c) => ({ ...c, isActive: wsapp.isItemCached(c.id) }));
    client.send("LIST_DIRECT_CONVERSATIONS", { directConversations });
  } catch (e) {
    release();
    client.send("ERROR", { event: "GET_DIRECT_CONVERSATIONS", error: e as Error });
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
  const user = client.user;
  const { db, release } = await DB_POOL.getConnection();

  try {
    const messages = await directMessagesService.selectByConversationId(db, id);
    release();

    if (user.id !== messages[0].fromUserId && user.id !== messages[0].toUserId) {
      const errMsg = `[wsapp][LIST_DIRECT_MESSAGES] Possible spoof : socket.user.id does not match either direct conversation member.`;
      const errData = { members: [messages[0].fromUserId, messages[0].toUserId], socket: user };
      return console.log(errMsg, errData);
    }

    client.send("LIST_DIRECT_MESSAGES", { directMessages: messages });
  } catch (e) {
    release();
    client.send("ERROR", { event: "GET_DIRECT_MESSAGES", error: e as Error });
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
  const user = client.user;
  const { db, release } = await DB_POOL.getConnection();

  try {
    const users = await directConversationService.selectInvitableUsers(db, user.id);
    release();
    client.send("LIST_INVITABLE_USERS", { users });
  } catch (e) {
    release();
    client.send("ERROR", { event: "GET_INVITABLE_USERS", error: e as Error });
  }
});
