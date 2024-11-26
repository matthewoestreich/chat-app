import { RawData, WebSocket, WebSocketServer } from "ws";
import jsonwebtoken from "jsonwebtoken";
import { v7 as uuidV7 } from "uuid";
import parseCookies from "./parseCookies";
import verifyTokenAsync from "./verifyTokenAsync";
import server from "../index";
import SQLitePool from "@/server/db/SQLitePool";
import errorCodeToReason, { WEBSOCKET_ERROR_CODE } from "./websocketErrorCodes";
import { chatService, messagesService, roomService } from "../db/services";

const WSS = new WebSocketServer({ server });
const DB_POOL = new SQLitePool(process.env.ABSOLUTE_DB_PATH!, 5);
// How we store references to sockets. Structured so we can track
// which users are in which rooms.
const BUCKETS: Map<string, Map<string, WebSocket>> = new Map();

WSS.on("connection", async (socket: WebSocket, req) => {
  const cookies = parseCookies(req.headers.cookie || "");
  const authenticated = await isAuthenticated(cookies?.session, socket);
  if (!authenticated) {
    const { code, definition } = WEBSOCKET_ERROR_CODE.Unauthorized;
    socket.close(code, definition);
    return;
  }

  socket.user = jsonwebtoken.decode(cookies.session) as Account;

  // Send user their rooms on first connection and add each room
  // to our data structure that tracks rooms and membership.
  const rooms = await getRoomsByUserId(socket);
  if (rooms) {
    sendMessage(socket, "rooms", { rooms });
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
      case "entered_room": {
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

      case "get_public_rooms": {
      }

      default: {
        console.log(`[ws] Unknown type on message!`, { message });
        break;
      }
    }
  });
});

async function handleEnteredRoom(socket: WebSocket, roomId: string) {
  if (!socket.user) {
    return;
  }
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
  sendMessage(socket, "entered_room", { members, messages });
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
  const { db, release } = await DB_POOL.getConnection();
  try {
    if (!socket.user || !socket.user.id) {
      console.log(`[ws][handleUnjoinRoom] empty user or user.id`, { user: socket?.user });
      sendMessage(socket, "unjoin", { ok: false, error: "empty user or user.id" });
      return;
    }
    await chatService.deleteRoomMember(db, roomId, socket.user.id);
    const updatedRooms = await chatService.selectRoomsByUserId(db, socket.user.id);
    release();
    handleLeaveRoom(socket, roomId);
    sendMessage(socket, "unjoin", { ok: true, rooms: updatedRooms });
  } catch (e) {
    console.error(`[ws][handleUnjoinRoom][ERROR]`, e);
    release();
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
    const m = await chatService.selectRoomMembersByRoomIdIgnoreUserId(connection.db, roomId, ignoreUserId);
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
  if (!fromUserId || !fromUserName || fromUserId !== socket?.user?.id || fromUserName !== socket.user?.name) {
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

function addRoomToBucket(roomId: string) {
  if (!BUCKETS.has(roomId)) {
    BUCKETS.set(roomId, new Map());
  }
}

function addRoomAndUserToBucket(roomId: string, userId: string, socket: WebSocket) {
  addRoomToBucket(roomId);
  BUCKETS.get(roomId)!.set(userId, socket);
}

async function isAuthenticated(token: string, socket: WebSocket) {
  if (!token) {
    return false;
  }
  try {
    const isValidToken = await verifyTokenAsync(token, process.env.JWT_SIGNATURE || "");
    if (!isValidToken) {
      const { code, definition } = WEBSOCKET_ERROR_CODE.Unauthorized;
      socket.close(code, definition);
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
