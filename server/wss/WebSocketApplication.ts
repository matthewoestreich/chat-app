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

    if (opts.onConnected) {
      opts.onConnected(this._self);
    }

    // Create "listener" for all messages..
    this.socket.on("message", async (rawMessage: RawData) => {
      const message = Message.parse(rawMessage);
      if (!message.type) {
        return;
      }

      const fn = this.handlers[message.type];
      if (fn) {
        return await fn(this._self, message.data);
      }

      this._catchFn(this, { unknownMessageType: message.type });
    });
  }

  on(messageType: AllowedWsMessageTypes, handler: WsRouteHandler) {
    this.handlers[messageType] = handler;
  }

  catch(handler: WsRouteHandler) {
    this._catchFn = handler;
  }

  sendMessage(msg: WsMessage) {
    this.socket.send(JSON.stringify(msg));
  }
}

/**
 * ParsedMessage class - essentially a parsed incoming message
 */
export class Message implements WsMessage {
  type: AllowedWsMessageTypes;
  data: any;

  constructor(type: AllowedWsMessageTypes, data: any) {
    this.type = type;
    this.data = data;
  }

  static parse(message: RawData): Message {
    if (!message) {
      return {} as Message;
    }
    const parsedMessage = JSON.parse(message.toString());
    const { type, ...data }: WsMessage = parsedMessage;
    if (!type) {
      console.log(`[IncomingMessage] message has no type`);
      return {} as Message;
    }
    return new Message(type, data);
  }
}
