import { IncomingMessage } from "node:http";
import { WebSocket } from "ws";
import jsonwebtoken from "jsonwebtoken";
import { v7 as uuidV7 } from "uuid";
import { chatService, directConversationService, messagesService, roomService } from "@/server/db/services/index";
import server from "@/server/index";
import SQLitePool from "@/server/db/SQLitePool";
import errorCodeToReason, { WEBSOCKET_ERROR_CODE } from "./websocketErrorCodes";
import parseCookies from "./parseCookies";
import verifyTokenAsync from "./verifyTokenAsync";
import WebSocketApp from "./WebSocketApp";
import EventType from "./EventType";
import WebSocketMessage from "./WebSocketMessage";

////////////////////////////////////////////////////////////////////////////////////////////////
// OLDER CODE - CAN REMOVE AFTER REFACTOR
////////////////////////////////////////////////////////////////////////////////////////////////
// For when someone first logs in or what not and they aren't in a room, but they're online.
const ACTIVE_NO_ROOM = "__online_no_room";
// How we store references to sockets. Structured so we can track
// which users are in which rooms.
const BUCKETS: Map<string, Map<string, WebSocket>> = new Map();
// Create a room for "online but not currently in a room"..
BUCKETS.set(ACTIVE_NO_ROOM, new Map());
//////////////////////////////////////////////////////////////////////////////////////////////////

////////// Updated code starts here
const DB_POOL = new SQLitePool(process.env.ABSOLUTE_DB_PATH!, 5);
const wsapp = new WebSocketApp({ server });

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
  const rooms = await chatService.selectRoomsByUserId(db, socket.user.id); // Send user their rooms.
  release();

  wsapp.emitToClient(new WebSocketMessage(EventType.LIST_ROOMS, { rooms }));
  rooms.forEach((room) => wsapp.cacheRoom(room.id)); // Add rooms to cache just so we have them there.
  wsapp.cacheUserInRoom(socket.user.id, ROOM_ID_UNASSIGNED); // Add user to "unassigned" room..
  socket.activeIn = ROOM_ID_UNASSIGNED;
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
  if (socket.activeIn) {
    handleLeaveRoom(socket, socket.activeIn);
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
wsapp.on(EventType.SEND_MESSAGE, async (socket: WebSocket, toRoomId: string, userId: string, userName: string, messageText: string) => {
  if (socket.user!.id !== userId) {
    const errMsg = `[wsapp][POSSIBLE_SPOOFING_ATTEMPT] sock.user.id !== userId`;
    const errData = { user: socket.user, message: { toRoomId, userId, userName, messageText } };
    console.error(errMsg, errData);
    return;
  }
  if (!wsapp.getCachedRoom(toRoomId)?.has(socket.user!.id)) {
    const errMsg = `[wsapp][POSSIBLE_SPOOFING_ATTEMPT] user attempted to send a message to a room they are not active in`;
    const errData = { user: socket.user, message: { toRoomId, userId, userName, messageText } };
    console.error(errMsg, errData);
    return;
  }

  const { db, release } = await DB_POOL.getConnection();

  try {
    wsapp.broadcast(toRoomId, new WebSocketMessage(EventType.SEND_MESSAGE, { userId, userName, messageText }));
    // No need to await this, we don't need a response, and nothing depends on the result.
    messagesService.insertMessage(db, toRoomId, userId, messageText);
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
wsapp.on(EventType.ENTER_ROOM, async (socket: WebSocket, roomId: string) => {
  const user = socket.user!;

  if (socket.activeIn) {
    wsapp.removeCachedUserFromRoom(user.id, socket.activeIn);
    wsapp.broadcast(socket.activeIn, new WebSocketMessage(EventType.MEMBER_LEFT_ROOM, user.id));
  }

  socket.activeIn = roomId;
  wsapp.broadcast(roomId, new WebSocketMessage(EventType.MEMBER_ENTERED_ROOM, user.id));
  wsapp.cacheUserInRoom(user.id, roomId);
  const { db, release } = await DB_POOL.getConnection();

  try {
    let members = await chatService.selectRoomMembersExcludingUser(db, roomId, user.id);
    members = members.map((m) => ({ ...m, isActive: wsapp.getCachedRoom(roomId)!.has(m.userId) }));
    const messages = await messagesService.selectByRoomId(db, roomId);
    release();
    wsapp.emitToClient(new WebSocketMessage(EventType.ENTER_ROOM, { members, messages }));
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
wsapp.on(EventType.JOIN_ROOM, async (socket: WebSocket, roomId: string) => {
  const user = socket.user!;
  const { db, release } = await DB_POOL.getConnection();

  try {
    const rooms = await chatService.addUserByIdToRoomById(db, user.id, roomId, true);
    release();
    wsapp.emitToClient(new WebSocketMessage(EventType.JOIN_ROOM, rooms));
  } catch (error) {
    release();
    wsapp.emitToClient(new WebSocketMessage(EventType.JOIN_ROOM, error as Error));
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
wsapp.on(EventType.UNJOIN_ROOM, async (socket: WebSocket, roomId: string) => {
  const user = socket.user!;
  const { db, release } = await DB_POOL.getConnection();

  try {
    await chatService.deleteRoomMember(db, roomId, user.id);
    const rooms = await chatService.selectRoomsByUserId(db, user.id);
    release();

    // Covers the case for when a user unjoins a room they are currently chatting in.
    if (socket.activeIn === roomId) {
      wsapp.broadcast(socket.activeIn, new WebSocketMessage(EventType.MEMBER_LEFT_ROOM, user.id));
      wsapp.removeCachedUserFromRoom(user.id, socket.activeIn);
    }

    wsapp.emitToClient(new WebSocketMessage(EventType.UNJOIN_ROOM, rooms));
  } catch (error) {
    release();
    wsapp.emitToClient(new WebSocketMessage(EventType.UNJOIN_ROOM, error as Error));
  }
});

/*
const WSS = new WebSocketServer({ server });
WSS.on("connection", async (socket: WebSocket, req) => {
  const cookies = parseCookies(req.headers.cookie || "");
  const authenticated = await isAuthenticated(cookies?.session);
  if (!authenticated) {
    const { code, definition } = WEBSOCKET_ERROR_CODE.Unauthorized;
    socket.close(code, definition);
    return;
  }

  socket.user = jsonwebtoken.decode(cookies.session) as Account;

  // - Add user to "active but not in a room" room..
  BUCKETS.get(ACTIVE_NO_ROOM)!.set(socket.user.id, socket);
  // - Send user their rooms on first connection and add each room
  // to our data structure that tracks rooms and membership.
  const rooms = await getRoomsByUserId(socket);
  if (rooms) {
    sendMessage(socket, "LIST_ROOMS", { rooms });
    for (const room of rooms) {
      if (!BUCKETS.has(room.id)) {
        BUCKETS.set(room.id, new Map());
      }
    }
  }

  socket.on("close", (code: number, reason: Buffer) => {
    if (socket.activeIn) {
      handleLeaveRoom(socket, socket.activeIn);
    }
    let why = { reason: reason.toString(), definition: "" };
    if (why.reason === "") {
      why = errorCodeToReason(code);
    }
    console.log(`socket closed.`, { user: socket?.user?.id || "NA", code, reason: why });
  });

  socket.on("message", async (rawMessage: RawData) => {
    const message = JSON.parse(rawMessage.toString());
    console.log(`[ws][new message]`, { message });
    if (!message?.type) {
      console.log(`[ws][socket.on("message")] Message missing type!`);
      return;
    }

    // Process message
    switch (message.type) {
      case "ENTER_ROOM": {
        handleEnteredRoom(socket, message?.roomId);
        break;
      }

      case "join": {
        const { userId, roomId } = message;
        handleJoinRoom(socket, userId, roomId);
        break;
      }

      case "unjoin": {
        const { roomId } = message;
        handleUnjoinRoom(socket, roomId);
        break;
      }

      case "send_message": {
        handleSendMessage(socket, message);
        break;
      }

      case "joinable_rooms": {
        handleGetJoinableRooms(socket);
        break;
      }

      case "create_room": {
        const { roomName, isPrivate } = message;
        handleCreateRoom(socket, roomName, isPrivate);
        break;
      }

      case "get_direct_conversations": {
        handleGetDirectConversations(socket);
        break;
      }

      case "get_public_rooms": {
      }

      default: {
        console.log(`[ws] Unknown type on message!`, { message });
        break;
      }
    }
  });
});
*/

async function handleEnteredRoom(socket: WebSocket, roomId: string) {
  if (!socket.user) {
    return;
  }
  // When someone first joins they're put in an "active, but not in a room" room.. remove them from it..
  removeFromBucketIfExists(ACTIVE_NO_ROOM, socket.user.id);
  // If they already had an active room, it means they're leaving it. So notify that room they left.
  if (socket.activeIn) {
    handleLeaveRoom(socket, socket.activeIn);
  }
  socket.activeIn = roomId; // Update to the rooms they just entered
  broadcastMemberStatus(roomId, socket.user.id, "member_entered"); // We also need to broadcast to the room that someone has joined.
  addRoomAndUserToBucket(roomId, socket.user.id, socket);
  const members = (await getRoomMembers(roomId, socket.user.id))!.map((m) => {
    m.isActive = BUCKETS.get(roomId)!.has(m.userId);
    return m;
  });
  const messages = await getMessages(roomId);
  sendMessage(socket, "ENTER_ROOM", { members, messages });
}

function handleLeaveRoom(socket: WebSocket, roomId: string) {
  if (!socket?.activeIn || !socket?.user?.id) {
    console.log(`[ws][handleLeaveRoom] either socket.activein or socket.user.id are empty..`, { activeIn: socket.activeIn, userId: socket?.user?.id });
    return;
  }
  broadcastMemberStatus(roomId, socket.user.id, "member_left");
  BUCKETS.get(roomId)!.delete(socket.user.id); // Remove them from bucket they left
}

async function handleSendMessage(socket: WebSocket, message: any) {
  const { fromUserName, fromUserId, toRoom, value } = message;
  broadcastMessage(socket, toRoom, fromUserId, fromUserName, value);
  const { db, release } = await DB_POOL.getConnection();
  messagesService.insertMessage(db, toRoom, fromUserId, value);
  release();
}

async function handleCreateRoom(socket: WebSocket, roomName: string, isPrivate: 0 | 1) {
  const { db, release } = await DB_POOL.getConnection();
  try {
    if (!socket.user || !socket.user.id) {
      const errMsg = `socket.user or socket.user.id is undefined!`;
      console.error(`[ws][handleCreateRoom] ${errMsg}`, { "socket.user": socket?.user });
      sendMessage(socket, "create_room", { ok: false, error: errMsg, rooms: [], createdRoomId: null });
      return;
    }
    const newroom = await roomService.insert(db, roomName, uuidV7(), isPrivate);
    addRoomAndUserToBucket(newroom.id, socket.user!.id, socket);
    const updatedRooms = await chatService.addUserByIdToRoomById(db, socket.user!.id, newroom.id, true);
    release();
    sendMessage(socket, "create_room", { ok: true, rooms: updatedRooms, createdRoomId: newroom.id, error: null });
  } catch (e) {
    release();
    console.log(`[handleCreateRoom][error]`, e);
    sendMessage(socket, "create_room", { ok: false, rooms: [], createdRoomId: null, error: e });
  }
}

async function handleJoinRoom(socket: WebSocket, userId: string, roomId: string) {
  const { db, release } = await DB_POOL.getConnection();
  try {
    const updatedRooms = await chatService.addUserByIdToRoomById(db, userId, roomId, true);
    release();
    sendMessage(socket, "joined", { ok: true, rooms: updatedRooms, joinedRoomId: roomId, error: null });
  } catch (e) {
    release();
    console.log(`[ws][handleJoinRoom][ERROR]`, e);
    sendMessage(socket, "joined", { ok: false, rooms: [], joinedRoomId: null, error: e });
  }
}

async function handleUnjoinRoom(socket: WebSocket, roomId: string) {
  const connection = await DB_POOL.getConnection();
  try {
    if (!socket.user || !socket.user.id) {
      console.log(`[ws][handleUnjoinRoom] empty user or user.id`, { user: socket?.user });
      sendMessage(socket, "unjoin", { ok: false, error: "empty user or user.id" });
      return;
    }
    await chatService.deleteRoomMember(connection.db, roomId, socket.user.id);
    const updatedRooms = await chatService.selectRoomsByUserId(connection.db, socket.user.id);
    connection.release();
    handleLeaveRoom(socket, roomId);
    sendMessage(socket, "unjoin", { ok: true, rooms: updatedRooms });
  } catch (e) {
    console.error(`[ws][handleUnjoinRoom][ERROR]`, e);
    if (!connection.isStale) {
      connection.release();
    }
    sendMessage(socket, "unjoin", { ok: false, error: e });
  }
}

async function handleGetJoinableRooms(socket: WebSocket) {
  if (!socket.user || !socket.user.id) {
    sendMessage(socket, "joinable_rooms", { ok: false, rooms: [], error: "missing socket.user or socket.user.id" });
    console.log(`[ws][handleGetJoinableRooms] socket.user or socket.user.id is missing!`, { "socket.user": socket.user });
    return;
  }
  const { db, release } = await DB_POOL.getConnection();
  try {
    const rooms = await roomService.selectUnjoinedRooms(db, socket.user.id);
    release();
    sendMessage(socket, "joinable_rooms", { ok: true, rooms, error: null });
  } catch (e) {
    release();
    console.log(`[ws][handleGetAllRooms][ERROR]`, e);
    sendMessage(socket, "joinable_rooms", { ok: false, rooms: [], error: e });
  }
}

async function handleGetDirectConversations(socket: WebSocket) {
  if (!socket.user || !socket.user.id) {
    console.log(`[ws][handleGetDirectConversations] missing socket.user or socket.user.id`, { "socket.user": socket.user });
    return;
  }
  const { db, release } = await DB_POOL.getConnection();
  try {
    let directConvos = await directConversationService.selectAllByUserId(db, socket.user.id);
    release();
    if (directConvos && directConvos.length) {
      directConvos = directConvos.map((dc) => {
        dc.isActive = isUserActiveInABucket(dc.id);
        return dc;
      });
    }
    sendMessage(socket, "get_direct_conversations", { ok: true, conversations: directConvos, error: null });
  } catch (e) {
    release();
    console.log(`[ws][handleGetDirectConversations][ERROR]`, e);
    sendMessage(socket, "get_direct_conversations", { ok: false, conversations: [], error: e });
  }
}

// Gets a chat message
async function getMessages(roomId: string): Promise<Message[]> {
  try {
    const { db, release } = await DB_POOL.getConnection();
    const messages = await messagesService.selectByRoomId(db, roomId);
    release();
    return messages;
  } catch (e) {
    return [];
  }
}

// Get all members of a specific room.
async function getRoomMembers(roomId: string, ignoreUserId?: string): Promise<RoomMember[] | null> {
  const connection = await DB_POOL.getConnection();
  if (ignoreUserId) {
    const m = await chatService.selectRoomMembersExcludingUser(connection.db, roomId, ignoreUserId);
    connection.release();
    return m;
  }
  const m = await chatService.selectRoomMembersByRoomId(connection.db, roomId);
  connection.release();
  return m;
}

// Get all rooms that a specific user is part of.
async function getRoomsByUserId(socket: WebSocket): Promise<Room[] | null> {
  const connection = await DB_POOL.getConnection();
  const user = socket?.user;
  if (!user) {
    console.log(`[ws][handleGetRoomMembers] 'user' not found on socket!`);
    return null;
  }
  const rooms = await chatService.selectRoomsByUserId(connection.db, user.id);
  connection.release();
  return rooms as Room[];
}

function broadcastMemberStatus(roomId: string, userId: string, status: "member_left" | "member_entered") {
  if (BUCKETS.has(roomId)) {
    for (const [existingUserId, socket] of BUCKETS.get(roomId)!) {
      if (userId !== existingUserId && socket.readyState === socket.OPEN) {
        sendMessage(socket, status, { id: userId });
      }
    }
  }
}

// Handle sending broadcast to all members of a specific room
function broadcastMessage(socket: WebSocket, toRoomId: string, fromUserId: string, fromUserName: string, message: string) {
  // Check for spoofing
  if (!fromUserId || !fromUserName || !validateSocketSender(socket, fromUserId) || fromUserName !== socket.user?.name) {
    console.log("[SPOOF_ATTEMPT] message spoof attempt!", { spoofedMessage: { toRoomId, fromUserId, fromUserName, message }, fromSocket: socket.user });
    return;
  }
  if (BUCKETS.has(toRoomId)) {
    // Verify the user that is sending the message is even active in this room..
    if (!BUCKETS.get(toRoomId)!.get(fromUserId)) {
      console.log("[SPOOF?] user not active in room attempted to send a message to that room.", { fromSocket: socket.user, spoofedMessage: { toRoomId, fromUserId, fromUserName, message } });
      return;
    }
    for (const [userId, socket] of BUCKETS.get(toRoomId)!) {
      if (userId !== fromUserId && socket.readyState === socket.OPEN) {
        sendMessage(socket, "message", { from: fromUserName, message });
      }
    }
  }
}

function isUserActiveInABucket(userId: string) {
  for (const [_roomId, members] of BUCKETS) {
    if (members.has(userId)) {
      return true;
    }
  }
  return false;
}

function removeFromBucketIfExists(roomId: string, userId: string) {
  if (BUCKETS.get(roomId)) {
    BUCKETS.get(roomId)!.delete(userId);
  }
}

function addRoomToBucket(roomId: string) {
  if (!BUCKETS.has(roomId)) {
    BUCKETS.set(roomId, new Map());
  }
}

function validateSocketSender(socket: WebSocket, providedUserId: string): boolean {
  if (!socket.user || !socket.user.id) {
    return false;
  }
  return socket.user.id === providedUserId;
}

function addRoomAndUserToBucket(roomId: string, userId: string, socket: WebSocket) {
  addRoomToBucket(roomId);
  BUCKETS.get(roomId)!.set(userId, socket);
}

async function isAuthenticated(token: string) {
  if (!token) {
    return false;
  }
  try {
    const isValidToken = await verifyTokenAsync(token, process.env.JWT_SIGNATURE || "");
    if (!isValidToken) {
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

function sendMessage(socket: WebSocket, type: string, data: { [k: string]: any }) {
  socket.send(JSON.stringify({ type, ...data }));
}
