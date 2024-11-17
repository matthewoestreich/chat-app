import { WebSocketServer, WebSocket } from "ws";
import parseCookies from "./parseCookies.js";
import verifyTokenAsync from "./verifyTokenAsync.js";
import server from "../index.js";
import websocketApp from "./websocketApp.js";
import SQLitePool from "@/server/db/SQLitePool.js";
import { chatService } from "@/server/db/services/index.js";
import { WEBSOCKET_ERROR_CODE } from "./websocketErrorCodes.js";

const wss = new WebSocketServer({ server });
const dbpath = process.env.ABSOLUTE_DB_PATH || "";
const dbpool = new SQLitePool(dbpath, 5);

// kind of like the "root" app
// when a socket connects, this only fires one time.
// on every subsequent message, the `socket.on("message", ...)` handler kicks in
wss.on("connection", async (socket: WebSocket, req) => {
  const cookies = parseCookies(req.headers.cookie || "");
  const authenticated = await isAuthenticated(cookies.session, socket);

  if (!authenticated) {
    socket.close(WEBSOCKET_ERROR_CODE.Unauthorized, "unauthorized");
    return;
  }

  // `wsapp.sendMessage` formats and sends a message for you.
  // Access it using the first param within any callback.
  const wsapp = websocketApp({
    socket: socket,
    databasePool: dbpool,
    cookies,
    onConnected: async (self: IWsApp) => {
      const { db, release } = await self.databasePool.getConnection();
      try {
        self.socket.send(JSON.stringify({ ok: true }));
        self.sendMessage("type_z", {});
        const rooms = await chatService.selectRoomsByUserId(db, self.account.id);
        release();
        self.sendMessage("rooms", { rooms: rooms as WsMessageData });
      } catch (e) {
        release();
      }
    },
  });

  wsapp.on("get_rooms", async (self: IWsApp, _data) => {
    const { db, release } = await self.databasePool.getConnection();
    try {
      self.socket.send(JSON.stringify({ ok: true }));
      const rooms = await chatService.selectRoomsByUserId(db, self.account.id);
      release();
      self.sendMessage("rooms", { rooms: rooms as WsMessageData });
    } catch (e) {
      release();
    }
  });

  wsapp.on("ping", async (self: IWsApp, data, reqst) => {
    console.log({ data, reqst });
    self.socket.send(JSON.stringify({ type: "pong" }));
  });

  //wsapp.on("chat", (socket, data) => {});
});

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
