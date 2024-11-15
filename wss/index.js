import { WebSocketServer } from "ws";
import parseCookies from "./parseCookies.js";
import useDbPool from "./useDbPool.js";
import verifyTokenAsync from "./verifyTokenAsync.js";
import server, { CHAT_ROOMS } from "../server/index.js";
import websocketApp from "./websocketApp.js";

// https://github.com/Luka967/websocket-close-codes?tab=readme-ov-file#websocket-close-codes
const WEBSOCKET_ERROR_CODE = {
  Unauthorized: 3000,
};

const wss = new WebSocketServer({ server });

// kind of like the "root" app
// when a socket connects, this only fires one time.
// on every subsequent message, the `socket.on("message", ...)` handler kicks in
wss.on("connection", async (socket, req) => {
  const { access_token } = parseCookies(req.headers.cookie);
  const authenticated = await isAuthenticated(access_token);

  if (!authenticated) {
    socket.close(WEBSOCKET_ERROR_CODE.Unauthorized, "unauthorized");
    return;
  }

  const wsapp = websocketApp(socket);

  wsapp.useOnce(useDbPool);

  wsapp.on("test", (socket, data) => {
    console.log({ socket, data });
  });

  wsapp.on("chat", (socket, data) => {});
});

async function isAuthenticated(accessToken) {
  if (!accessToken) {
    return false;
  }
  const isValidToken = await verifyTokenAsync(accessToken, process.env.JWT_SIGNATURE);
  if (!isValidToken) {
    socket.close(WEBSOCKET_ERROR_CODE.Unauthorized, "unauthorized");
    return false;
  }
  return true;
}
