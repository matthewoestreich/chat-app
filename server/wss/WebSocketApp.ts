import EventEmitter from "node:events";
import { IncomingMessage } from "node:http";
import { WebSocketServer, WebSocket, ServerOptions, RawData } from "ws";
import WebSocketMessage from "./WebSocketMessage";
import EventType from "./EventType";

export default class WebSocketApp extends EventEmitter {
  private server: WebSocketServer;
  private socket: WebSocket;

  private static rooms: Map<string, Map<string, WebSocket>> = new Map();

  private parseRawMessage(rawMessage: RawData): WebSocketMessage {
    try {
      const message = WebSocketMessage.from(rawMessage);
      if (!message.type) {
        return new WebSocketMessage(EventType.ERROR, new Error("Message missing 'type' key"));
      }
      if (!(message.type in EventType)) {
        return new WebSocketMessage(EventType.ERROR, new Error("Unkown message type."));
      }
      return message;
    } catch (e) {
      return new WebSocketMessage(EventType.ERROR, e as Error);
    }
  }

  constructor(options?: ServerOptions) {
    super();
    this.server = new WebSocketServer(options);
    this.socket = {} as WebSocket;

    this.server.on("connection", async (socket: WebSocket, request: IncomingMessage) => {
      this.socket = socket;
      this.emit(EventType.CONNECTION_ESTABLISHED, socket, request);

      socket.on("close", (code: number, reason: Buffer) => {
        this.emit(EventType.CONNECTION_CLOSED, socket, code, reason);
      });

      socket.on("message", (rawMessage: RawData, _isBinary: boolean) => {
        const { error, type, ...data } = this.parseRawMessage(rawMessage);
        if (error) {
          return this.emit(EventType.ERROR, error);
        }
        this.emit(type, data);
      });
    });
  }

  emitToClient(eventType: EventType, data: IWebSocketMessageData) {
    this.socket.send(new WebSocketMessage(eventType, data).toJSONString());
  }

  getCachedRoom(roomId: string) {
    return WebSocketApp.rooms.get(roomId);
  }

  removeCachedRoom(roomId: string) {
    WebSocketApp.rooms.delete(roomId);
  }

  removeCachedUserFromRoom(roomId: string, userId: string) {
    const room = this.getCachedRoom(roomId);
    if (room && room.has(userId)) {
      room.delete(userId);
      if (room.size === 0) {
        this.removeCachedRoom(roomId);
      }
    }
  }

  // Creates a room within our "rooms" cache if it doesn't exist.
  cacheRoom(roomId: string) {
    if (!WebSocketApp.rooms.has(roomId)) {
      WebSocketApp.rooms.set(roomId, new Map());
    }
  }

  // Will create a room if it doesn't exist and add a user to it.
  cacheUserInRoom(userId: string, roomId: string) {
    if (!this.socket) {
      return;
    }
    this.cacheRoom(roomId);
    this.getCachedRoom(roomId)!.set(userId, this.socket);
  }
}
