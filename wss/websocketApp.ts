import { ClientRequest, IncomingMessage } from "node:http";
import jsonwebtoken from "jsonwebtoken";
import { WebSocket } from "ws";

export default function (options: WsAppOptions) {
  return new WsApp(options);
}

// Only parses ws.on("message") requests.
// Each message must be in JSON parsable string format.
// Each parsed JSON message must have a "type" field.
// The contents of the "type" field is how we "route"..
// For example, this route:
//    `wsapp.on("foo", (socket, data) => { ... });
// Would have been sent the following message:
//    `const msg = JSON.parse({ type: "foo", other: [date], goes: "here", valid {json:true} })`
// The { type: "foo" } being the most important.
class WsApp<T> implements IWsApp {
  self: IWsApp;
  socket: WebSocket;
  types: { [key: string]: WsAppHandler };
  databasePool: DatabasePool<T>;
  meta: { [key: string]: any }; // store misc data for this socket app
  cookies: WsCookies;
  account: Account;

  constructor(options: WsAppOptions) {
    this.self = this;
    this.socket = options.socket;
    this.databasePool = options.databasePool;
    this.cookies = options.cookies || { session: "" };
    this.account = {} as Account;
    this.types = {};
    this.meta = {};

    if (this.cookies.session !== "") {
      this.account = jsonwebtoken.decode(this.cookies.session) as Account;
    }
    if (options.onConnected) {
      options.onConnected(this.self);
    }

    this.socket.on("message", async (message: string, req: ClientRequest, res: IncomingMessage) => {
      const result = this.isJSON(message);
      if (!result.ok) {
        console.log("ERROR", { name: "RTChatWebSocketError", message: "parsed message not valid json!", data: { message: message.toString() } });
        return;
      }
      const data = result.data;
      if (!data.type) {
        console.log("ERROR", { name: "RTChatWebSocketError", message: "message missing 'type' key!", data: { message: data } });
        return;
      }
      const handler = this.types[data.type];
      if (!handler) {
        return;
      }
      await handler(this.self, data, req, res);
    });
  }

  private isJSON(str: string): { ok: boolean; data: WsAppMessage } {
    try {
      const v = JSON.parse(str);
      return { ok: true, data: v };
    } catch (e) {
      return { ok: false, data: { type: "" } };
    }
  }

  sendMessage(type: string, data: WsMessageData) {
    this.socket.send(JSON.stringify({ type, ...data }));
  }

  on(type: string, handler: WsAppHandler) {
    this.types[type] = handler;
  }
}
