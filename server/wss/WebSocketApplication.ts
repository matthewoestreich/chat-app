import { RawData, WebSocket } from "ws";

/**
 * Main WebSocketApplication class
 //TODO: make comments that explain what this does 
 */
export default class WebSocketApplication<T> implements WsApplication {
  private _self;
  socket: WebSocket;
  handlers: WsMessageTypeHandler = {};
  databasePool: DatabasePool<T>;
  account: Account;

  private _catchFn: WsRouteHandler = () => undefined;

  constructor(opts: WebSocketApplicationOptions) {
    this._self = this;
    this.socket = opts.socket;
    this.databasePool = opts.databasePool;
    this.account = opts.account;

    this.socket.on("message", async (rawMessage: RawData) => {
      const message = IncomingMessage.parse(rawMessage);
      if (!message.type) {
        return;
      }
      const fn = this.handlers[message.type];
      if (fn) {
        await fn(this._self, message.data);
        return;
      }
      this._catchFn(this, { unknownMessageType: message.type });
      return;
    });
  }

  on(messageType: AllowedWsMessageTypes, handler: WsRouteHandler) {
    this.handlers[messageType] = handler;
  }

  catch(handler: WsRouteHandler) {
    this._catchFn = handler;
  }

  sendMessage(msg: WsMessage) {
    this.socket.send(JSON.stringify({ type: msg.type, ...msg.data }));
  }
}

/**
 * IncomingMessage class - this comment is here to make visual code boundaries
 * more pronounced.
 */
export class IncomingMessage {
  static parse(message: RawData): ParsedMessage {
    if (!message) {
      return {} as ParsedMessage;
    }
    const parsedMessage = JSON.parse(message.toString());
    const { type, ...data }: WsMessage = parsedMessage;
    if (!type) {
      console.log(`[IncomingMessage] message has no type`);
      return {} as ParsedMessage;
    }
    return new ParsedMessage(type, data);
  }
}

/**
 * ParsedMessage class - essentially a parsed incoming message
 */
export class ParsedMessage {
  type: AllowedWsMessageTypes;
  data: WsMessageData;

  constructor(type: AllowedWsMessageTypes, data: WsMessageData) {
    this.type = type;
    this.data = data;
  }
}
