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
import EventType from "./EventType";
import WebSocketMessage from "./WebSocketMessage";

const DB_POOL = new SQLitePool(process.env.ABSOLUTE_DB_PATH!, 5);
const wsapp = new WebSocketApp();

export default function startWebSocketApp(server: Server<typeof IncomingMessage, typeof ServerResponse>, callback?: () => void): void {
  wsapp.listen({ server }, callback);
}

// Catch any errors.
// Wanted to be more explicit with this as opposed to emitting an 'ERROR' event type.
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
wsapp.on(EventType.CONNECTION_ESTABLISHED, async (socket: WebSocket, req: IncomingMessage) => {
  const cookies = parseCookies(req.headers.cookie || "");
  if (!(await isAuthenticated(cookies?.session))) {
    const { code, definition } = WEBSOCKET_ERROR_CODE.Unauthorized;
    return socket.close(code, definition);
  }

  socket.user = jsonwebtoken.decode(cookies.session) as Account;

  const { db, release } = await DB_POOL.getConnection();
  const rooms = await chatService.selectRoomsByUserId(db, socket.user.id);
  release();

  wsapp.send(new WebSocketMessage(EventType.LIST_ROOMS, { rooms }));
  rooms.forEach((room) => wsapp.cacheRoom(room.id)); // Add rooms to cache just so we have them there.
  wsapp.cacheUserInRoom(socket.user.id, WebSocketApp.ROOM_ID_UNASSIGNED); // Add user to "unassigned" room..
  socket.activeIn = WebSocketApp.ROOM_ID_UNASSIGNED;
});

/**
 *
 * @event {CONNECTION_CLOSED}
 *
 * CONNECTION_CLOSED fires when a socket is closed. This allows us to clean up and
 * log the reason for socket closure.
 *
 */
wsapp.on(EventType.CONNECTION_CLOSED, (socket: WebSocket, code: number, reason: Buffer) => {
  const user = socket.user!;

  if (socket.activeIn) {
    wsapp.broadcast(socket.activeIn, new WebSocketMessage(EventType.MEMBER_LEFT_ROOM, { id: user.id }));
    wsapp.removeCachedUserFromRoom(user.id, socket.activeIn);
  }

  // Trying to figure out how Render force closes my sockets. Maybe can automate reopening them?
  const reasonString = reason.toString();
  const why = reasonString === "" ? errorCodeToReason(code) : { reason: reasonString, definition: "" };
  console.log(`socket closed.`, { user: socket?.user, code, why });
});

/**
 *
 * @event {SEND_MESSAGE}
 *
 * Someone is sending a chat message to a room.
 *
 */
wsapp.on(EventType.SEND_MESSAGE, async (socket: WebSocket, { roomId, messageText }: SendMessagePayload) => {
  const user = socket.user!;
  wsapp.broadcast(roomId, new WebSocketMessage(EventType.SEND_MESSAGE, { userId: user.id, userName: user.name, messageText }));

  const { db, release } = await DB_POOL.getConnection();

  try {
    // No need to await this, we don't need a response, and nothing depends on the result.
    messagesService.insertMessage(db, roomId, user.id, messageText);
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
wsapp.on(EventType.ENTER_ROOM, async (socket: WebSocket, { roomId }: EnterRoomPayload) => {
  const user = socket.user!;

  // Notify existing room (which user is now leaving) that user is leaving.
  if (socket.activeIn) {
    wsapp.removeCachedUserFromRoom(user.id, socket.activeIn);
    wsapp.broadcast(socket.activeIn, new WebSocketMessage(EventType.MEMBER_LEFT_ROOM, { id: user.id }));
  }

  wsapp.broadcast(roomId, new WebSocketMessage(EventType.MEMBER_ENTERED_ROOM, { id: user.id }));
  wsapp.cacheUserInRoom(user.id, roomId);
  socket.activeIn = roomId;

  const { db, release } = await DB_POOL.getConnection();

  try {
    let members = await chatService.selectRoomMembersExcludingUser(db, roomId, user.id);
    const messages = await messagesService.selectByRoomId(db, roomId);
    release();
    // Add `isActive` property for each user in this room based upon if they're cached in this room.
    members = members.map((m) => ({ ...m, isActive: wsapp.getCachedRoom(roomId)!.has(m.userId) }));
    wsapp.send(new WebSocketMessage(EventType.ENTER_ROOM, { members, messages }));
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
wsapp.on(EventType.JOIN_ROOM, async (socket: WebSocket, { id }: JoinRoomPayload) => {
  const user = socket.user!;
  const { db, release } = await DB_POOL.getConnection();

  try {
    const rooms = await chatService.addUserByIdToRoomById(db, user.id, id, true);
    release();
    wsapp.send(new WebSocketMessage(EventType.JOIN_ROOM, { rooms }));
  } catch (e) {
    release();
    wsapp.send(new WebSocketMessage(EventType.JOIN_ROOM, { error: e as Error }));
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
wsapp.on(EventType.UNJOIN_ROOM, async (socket: WebSocket, { id }: UnjoinRoomPayload) => {
  const user = socket.user!;
  const { db, release } = await DB_POOL.getConnection();

  try {
    if (!(await chatService.deleteRoomMember(db, id, user.id))) {
      throw new Error("Something went wrong while removing.");
    }

    const rooms = await chatService.selectRoomsByUserId(db, user.id);
    release();

    wsapp.send(new WebSocketMessage(EventType.UNJOIN_ROOM, { rooms }));

    // Covers the case for when a user unjoins a room they are currently chatting in.
    if (socket.activeIn && socket.activeIn === id) {
      wsapp.broadcast(socket.activeIn, new WebSocketMessage(EventType.MEMBER_LEFT_ROOM, { id: user.id }));
      wsapp.removeCachedUserFromRoom(user.id, socket.activeIn);
    }
  } catch (e) {
    release();
    wsapp.send(new WebSocketMessage(EventType.UNJOIN_ROOM, { error: e as Error }));
  }
});

/**
 *
 * @event {CREATE_ROOM}
 *
 * Creates a new room. The creator of the room is auto-joined.
 *
 */
wsapp.on(EventType.CREATE_ROOM, async (socket: WebSocket, { name, isPrivate }: CreateRoomPayload) => {
  const user = socket.user!;
  const { db, release } = await DB_POOL.getConnection();

  if (!isPrivate) {
    isPrivate = 0;
  }

  try {
    const room = await roomService.insert(db, name, uuidV7(), isPrivate);
    const rooms = await chatService.addUserByIdToRoomById(db, user.id, room.id, true);
    release();
    wsapp.send(new WebSocketMessage(EventType.CREATE_ROOM, { id: room.id, rooms }));
    wsapp.cacheRoom(room.id);
  } catch (e) {
    release();
    wsapp.send(new WebSocketMessage(EventType.CREATE_ROOM, { error: e as Error }));
  }
});

/**
 *
 * @event {LIST_JOINABLE_ROOMS}
 *
 * Gets all rooms that a user is not already a member of.
 *
 */
wsapp.on(EventType.LIST_JOINABLE_ROOMS, async (socket: WebSocket) => {
  const user = socket.user!;
  const { db, release } = await DB_POOL.getConnection();

  try {
    const rooms = await roomService.selectUnjoinedRooms(db, user.id);
    release();
    wsapp.send(new WebSocketMessage(EventType.LIST_JOINABLE_ROOMS, { rooms }));
  } catch (e) {
    release();
    wsapp.send(new WebSocketMessage(EventType.LIST_JOINABLE_ROOMS, { error: e as Error }));
  }
});

/**
 *
 * @event {LIST_DIRECT_CONVERSATIONS}
 *
 * Gets all direct conversations (DMs) that a user is currently in.
 *
 */
wsapp.on(EventType.LIST_DIRECT_CONVERSATIONS, async (socket: WebSocket) => {
  const user = socket.user!;
  const { db, release } = await DB_POOL.getConnection();

  try {
    const dc = await directConversationService.selectAllByUserId(db, user.id);
    release();
    const directConversations = dc.map((c) => ({ ...c, isActive: wsapp.cacheContainsUser(c.id) }));
    wsapp.send(new WebSocketMessage(EventType.LIST_DIRECT_CONVERSATIONS, { directConversations }));
  } catch (error) {
    release();
    wsapp.send(new WebSocketMessage(EventType.LIST_DIRECT_CONVERSATIONS, { error: error as Error }));
  }
});

/**
 *
 * @event {LIST_DIRECT_MESSAGES}
 *
 * Gets all messages in a direct conversation.
 *
 */
wsapp.on(EventType.LIST_DIRECT_MESSAGES, async (socket: WebSocket, { id }: DirectMessagesPayload) => {
  const user = socket.user!;
  const { db, release } = await DB_POOL.getConnection();

  try {
    const messages = await directMessagesService.selectByConversationId(db, id);
    release();
    if (user.id !== messages[0].fromUserId && user.id !== messages[0].toUserId) {
      const errMsg = `[wsapp][LIST_DIRECT_MESSAGES] Possible spoof : socket.user.id does not match either direct conversation member.`;
      const errData = { members: [messages[0].fromUserId, messages[0].toUserId], socket: user };
      console.log(errMsg, errData);
      return;
    }
    wsapp.send(new WebSocketMessage(EventType.LIST_DIRECT_MESSAGES, { messages }));
  } catch (e) {
    release();
    wsapp.send(new WebSocketMessage(EventType.LIST_DIRECT_MESSAGES, { error: e as Error }));
  }
});

/**
 *
 * @event {LIST_INVITABLE_USERS}
 *
 * Gets all users you are not currently in a direct conversation with..
 *
 */
wsapp.on(EventType.LIST_INVITABLE_USERS, async (socket: WebSocket, {}) => {
  const user = socket.user!;
  const { db, release } = await DB_POOL.getConnection();

  try {
    const users = await directConversationService.selectInvitableUsers(db, user.id);
    release();
    wsapp.send(new WebSocketMessage(EventType.LIST_INVITABLE_USERS, { users }));
  } catch (e) {
    release();
    wsapp.send(new WebSocketMessage(EventType.LIST_INVITABLE_USERS, { error: e as Error }));
  }
});
