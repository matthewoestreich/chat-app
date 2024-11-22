import { RawData, WebSocket, WebSocketServer } from "ws";
import jsonwebtoken from "jsonwebtoken";
import parseCookies from "./parseCookies";
import verifyTokenAsync from "./verifyTokenAsync";
import server from "../index";
import SQLitePool from "@/server/db/SQLitePool";
import { WEBSOCKET_ERROR_CODE } from "./websocketErrorCodes";
import { chatService } from "../db/services";

const wss = new WebSocketServer({ server });
const dbpath = process.env.ABSOLUTE_DB_PATH || "";
const sqlitePool = new SQLitePool(dbpath, 5);

wss.on("connection", async (socket: WebSocket, req) => {
  const cookies = parseCookies(req.headers.cookie || "");
  const authenticated = await isAuthenticated(cookies?.session, socket);
  if (!authenticated) {
    socket.close(WEBSOCKET_ERROR_CODE.Unauthorized, "unauthorized");
    return;
  }

  socket.user = jsonwebtoken.decode(cookies.session) as Account;
  socket.databasePool = sqlitePool;
  socket.chatColor = generateLightColor();

  // Send user their rooms on first connection
  const rooms = await getRoomsByUserId(socket);
  if (rooms) {
    sendMessage(socket, "rooms", { rooms });
  }

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
        handleEnteredRoom(wss, socket, message?.roomId);
        break;
      }

      case "send_message": {
        let color = socket.chatColor;
        if (!color) {
          color = generateLightColor();
        }
        broadcastMessage(wss, message?.fromUserId, message?.fromUserName, color, message?.toRoom, message?.value);
        break;
      }

      default: {
        console.log(`[ws] Unknown type on message!`, { message });
        break;
      }
    }
  });
});

async function handleEnteredRoom(wss: WebSocketServer, socket: WebSocket, roomId: string) {
  if (!socket.user || !socket.databasePool) {
    return;
  }
  // If they already had an active room, it means they're leaving it. So notify that room they left.
  if (socket.activeIn) {
    // Here, socket.activeIn is the room they just left.
    broadcastMemberStatus(wss, socket.activeIn, socket.user.id, "left");
  }
  socket.activeIn = roomId;
  // We also need to broadcast to the room that someone has joined.
  broadcastMemberStatus(wss, roomId, socket.user.id, "entered");
  const members = await getRoomMembers(wss, socket, roomId);
  sendMessage(socket, "send_room_members", { members });
}

// Get all members of a specific room.
async function getRoomMembers(wss: WebSocketServer, socket: WebSocket, roomId: string): Promise<RoomMember[] | null> {
  const connection = await socket?.databasePool?.getConnection();
  if (!connection) {
    return null;
  }
  const user = socket?.user;
  if (!user) {
    return null;
  }
  const members = await chatService.selectRoomMembersByRoomId(connection.db, roomId);
  connection.release();
  getActiveRoomMembers(wss, roomId).forEach((rm) => {
    const index = members.findIndex((m) => m.userId === rm.userId);
    if (index !== -1) {
      members[index].isActive = true;
    }
  });
  return members.filter((m) => m.userId !== user.id);
}

function getActiveRoomMembers(wss: WebSocketServer, roomId: string): RoomMember[] {
  const members: RoomMember[] = [];
  wss.clients.forEach((c: WebSocket) => {
    if (c && c.activeIn && c.activeIn === roomId && c.user) {
      members.push({ userName: c.user.name, userId: c.user.id, roomId, isActive: true });
    }
  });
  return members;
}

// Get all rooms that a specific user is part of.
async function getRoomsByUserId(socket: WebSocket): Promise<Room[] | null> {
  const connection = await socket?.databasePool?.getConnection();
  if (!connection) {
    console.log(`[ws][handleGetUsersRooms] 'databasePool' not found on socket!`);
    return null;
  }
  const user = socket?.user;
  if (!user) {
    console.log(`[ws][handleGetRoomMembers] 'user' not found on socket!`);
    return null;
  }
  const rooms = await chatService.selectRoomsByUserId(connection.db, user.id);
  connection.release();
  return rooms as Room[];
}

function broadcastMemberStatus(wss: WebSocketServer, roomId: string, userId: string, status: "left" | "entered") {
  if (userId === "") {
    console.log(`[ws][broadcastEnteredRoom] Joining member id is missing!`);
    return;
  }
  wss.clients.forEach((c: WebSocket) => {
    if (c && c.user && c.activeIn === roomId && c.user.id !== userId) {
      sendMessage(c, status, { id: userId });
    }
  });
}

// Handle sending broadcast to all members of a specific room
function broadcastMessage(wss: WebSocketServer, fromUserId: string, fromUserName: string, chatColor: string, toRoomId: string, messageText: string) {
  // Get all active members of this room..
  wss.clients.forEach((c: WebSocket) => {
    if (c && c.user && c.activeIn === toRoomId && c.user.id !== fromUserId) {
      sendMessage(c, "broadcast", { from: fromUserName, message: messageText, color: chatColor });
    }
  });
}

async function isAuthenticated(token: string, socket: WebSocket) {
  if (!token) {
    return false;
  }
  try {
    const isValidToken = await verifyTokenAsync(token, process.env.JWT_SIGNATURE || "");
    if (!isValidToken) {
      socket.close(WEBSOCKET_ERROR_CODE.Unauthorized, "unauthorized");
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
