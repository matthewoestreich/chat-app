import { WebSocketServer, WebSocket } from "ws";
import jsonwebtoken from "jsonwebtoken";
import parseCookies from "./parseCookies";
import verifyTokenAsync from "./verifyTokenAsync";
import server from "../index";
import SQLitePool from "@/server/db/SQLitePool";
import { WEBSOCKET_ERROR_CODE } from "./websocketErrorCodes";
import WebSocketApplication, { Message } from "./WebSocketApplication";
import { chatService } from "../db/services";

const wss = new WebSocketServer({ server });
const dbpath = process.env.ABSOLUTE_DB_PATH || "";
const dbpool = new SQLitePool(dbpath, 5);

wss.on("connection", async (socket: WebSocket, req) => {
  const cookies = parseCookies(req.headers.cookie || "");
  const authenticated = await isAuthenticated(cookies?.session, socket);
  if (!authenticated) {
    socket.close(WEBSOCKET_ERROR_CODE.Unauthorized, "unauthorized");
    return;
  }

  const wsapp = new WebSocketApplication({
    socket: socket,
    databasePool: dbpool,
    account: jsonwebtoken.decode(cookies.session) as Account,
    onConnected: async (self) => {
      const { db, release } = await self.databasePool.getConnection();
      const rooms = await chatService.selectRoomsByUserId(db, self.account.id);
      release();
      self.sendMessage(new Message("rooms", rooms));
    },
  });

  wsapp.on("send_broadcast", function (self: WsApplication, _data) {
    self.sendMessage({ type: "general", data: { ok: "nope" } });
  });

  // @ts-ignore
  wsapp.catch((self) => {
    console.log("catch");
  });
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
