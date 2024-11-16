import { WebSocketServer } from "ws";
import parseCookies from "./parseCookies.js";
import useDbPool from "./useDbPool.js";
import verifyTokenAsync from "./verifyTokenAsync.js";
import server, { CHAT_ROOMS } from "../server/index.js";
import websocketApp from "./websocketApp.js";

// https://github.com/Luka967/websocket-close-codes?tab=readme-ov-file#websocket-close-codes
const WEBSOCKET_ERROR_CODE = {
  NormalClosure: 1000, // Successful operation, connection not required anymore
  GoingAway: 1001, // Browser tab closing, graceful server shutdown
  UnsupportedData: 1003, // Endpoint received unsupported frame (e.g. binary-only got text frame, ping/pong frames not handled properly)
  NoStatusRcvd: 1005, // Got no close status but transport layer finished normally (e.g. TCP FIN but no previous CLOSE frame)
  AbnormalClosure: 1006, // Transport layer broke (e.g. couldn't connect, TCP RST)
  InvalidFramePayloadData: 1007, // Data in endpoint's frame is not consistent (e.g. malformed UTF-8)
  PolicyViolation: 1008, // Generic code not applicable to any other (e.g. isn't 1003 nor 1009)
  MessageTooBig: 1009, // Endpoint won't process large message
  InternalError: 1011, // Unexpected server problem while operating
  ServiceRestart: 1012, // Server/service is restarting
  Unauthorized: 3000, // Endpoint must be authorized to perform application-based request. Equivalent to HTTP 401
  Forbidden: 3003, // Endpoint is authorized but has no permissions to perform application-based request. Equivalent to HTTP 403
};

const wss = new WebSocketServer({ server });

// kind of like the "root" app
// when a socket connects, this only fires one time.
// on every subsequent message, the `socket.on("message", ...)` handler kicks in
wss.on("connection", async (socket, req) => {
  const { session } = parseCookies(req.headers.cookie);
  const authenticated = await isAuthenticated(session);

  if (!authenticated) {
    socket.close(WEBSOCKET_ERROR_CODE.Unauthorized, "unauthorized");
    return;
  }

  const wsapp = websocketApp(socket);

  wsapp.useOnce(useDbPool);

  wsapp.on("test", (socket, data) => {
    console.log("test received.");
  });

  wsapp.on("chat", (socket, data) => {});
});

async function isAuthenticated(token) {
  if (!token) {
    return false;
  }
  try {
    const isValidToken = await verifyTokenAsync(token, process.env.JWT_SIGNATURE);
    if (!isValidToken) {
      socket.close(WEBSOCKET_ERROR_CODE.Unauthorized, "unauthorized");
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}
