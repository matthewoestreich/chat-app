import { RawData, WebSocket, WebSocketServer } from "ws";
import jsonwebtoken from "jsonwebtoken";
import parseCookies from "./parseCookies";
import verifyTokenAsync from "./verifyTokenAsync";
import server from "../index";
import SQLitePool from "@/server/db/SQLitePool";
import errorCodeToReason, { WEBSOCKET_ERROR_CODE } from "./websocketErrorCodes";
import { chatService } from "../db/services";

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
  socket.chatColor = generateLightColor();

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

      case "unjoin": {
        const { roomId } = message;
        handleUnjoinRoom(socket, roomId);
        break;
      }

      case "send_message": {
        handleSendMessage(socket, message);
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
  if (socket.activeIn) {
    // If they already had an active room, it means they're leaving it. So notify that room they left.
    handleLeaveRoom(socket, socket.activeIn);
  }

  socket.activeIn = roomId; // Update to the rooms they just entered
  broadcastMemberStatus(roomId, socket.user.id, "entered"); // We also need to broadcast to the room that someone has joined.
  BUCKETS.get(roomId)!.set(socket.user.id, socket);

  const members = (await getRoomMembers(roomId, socket.user.id))!.map((m) => {
    m.isActive = BUCKETS.get(roomId)!.has(m.userId);
    return m;
  });

  sendMessage(socket, "members", { members });
}

function handleLeaveRoom(socket: WebSocket, roomId: string) {
  if (!socket?.activeIn || !socket?.user?.id) {
    console.log(`[ws][handleLeaveRoom] either socket.activein or socket.user.id are empty..`, { activeIn: socket.activeIn, userId: socket?.user?.id });
    return;
  }
  broadcastMemberStatus(socket.activeIn, socket.user.id, "left"); // Here, socket.activeIn is the room they just left.
  BUCKETS.get(roomId)!.delete(socket.user.id); // Remove them from bucket they left
}

function handleSendMessage(socket: WebSocket, message: any) {
  if (!socket.chatColor) {
    socket.chatColor = generateLightColor();
  }
  const { fromUserName, fromUserId, toRoom, value } = message;
  broadcastMessage(toRoom, fromUserId, fromUserName, value, socket.chatColor);
}

async function handleUnjoinRoom(socket: WebSocket, roomId: string) {
  try {
    if (!socket.user || !socket.user.id) {
      console.log(`[ws][handleUnjoinRoom] empty user or user.id`, { user: socket?.user });
      sendMessage(socket, "unjoined", { ok: false, error: "empty user or user.id" });
      return;
    }
    const { db, release } = await DB_POOL.getConnection();
    await chatService.deleteRoomMember(db, roomId, socket.user.id);
    const updatedRooms = await chatService.selectRoomsByUserId(db, socket.user.id);
    release();
    handleLeaveRoom(socket, roomId);
    sendMessage(socket, "unjoined", { ok: true, rooms: updatedRooms });
  } catch (e) {
    console.error(`[ws][handleUnjoinRoom][ERROR]`, e);
    sendMessage(socket, "unjoined", { ok: false, error: e });
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

function broadcastMemberStatus(roomId: string, userId: string, status: "left" | "entered") {
  if (BUCKETS.has(roomId)) {
    for (const [_, socket] of BUCKETS.get(roomId)!) {
      if (socket.readyState === socket.OPEN) {
        sendMessage(socket, status, { id: userId });
      }
    }
  }
}

// Handle sending broadcast to all members of a specific room
function broadcastMessage(toRoomId: string, fromUserId: string, fromUserName: string, message: string, chatColor: string) {
  if (BUCKETS.has(toRoomId)) {
    for (const [userId, socket] of BUCKETS.get(toRoomId)!) {
      if (userId !== fromUserId && socket.readyState === socket.OPEN) {
        sendMessage(socket, "message", { from: fromUserName, color: chatColor, message });
      }
    }
  }
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

function generateLightColor(): string {
  // Helper function to generate a random light color
  function getRandomLightColor(): string {
    const r = Math.floor(128 + Math.random() * 128); // Range 128–255
    const g = Math.floor(128 + Math.random() * 128);
    const b = Math.floor(128 + Math.random() * 128);
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }

  // Helper function to calculate the relative luminance of a color
  function getLuminance(hexColor: string): number {
    const hex = hexColor.replace("#", "");
    const rgb = [parseInt(hex.substring(0, 2), 16), parseInt(hex.substring(2, 4), 16), parseInt(hex.substring(4, 6), 16)].map((channel) => {
      const scaled = channel / 255;
      return scaled <= 0.03928 ? scaled / 12.92 : Math.pow((scaled + 0.055) / 1.055, 2.4);
    });

    // Luminance formula
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  }

  // Helper function to check contrast ratio
  function hasSufficientContrast(luminance: number): boolean {
    const blackLuminance = 0; // Luminance of black
    const contrastRatio = (luminance + 0.05) / (blackLuminance + 0.05);
    return contrastRatio > 4.5; // WCAG recommended contrast ratio for normal text
  }

  // Loop until a color with sufficient contrast is found
  while (true) {
    const color = getRandomLightColor();
    const luminance = getLuminance(color);
    if (hasSufficientContrast(luminance)) {
      return color;
    }
  }
}
