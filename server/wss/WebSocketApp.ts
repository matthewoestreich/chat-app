import EventEmitter from "node:events";
import { IncomingMessage } from "node:http";
import { WebSocketServer, WebSocket, ServerOptions, RawData } from "ws";
import verifyTokenAsync from "./verifyTokenAsync";
import WebSocketMessage from "./WebSocketMessage";
import EventType from "./EventType";

export default class WebSocketApp extends EventEmitter {
  private server: WebSocketServer;
  private socket?: WebSocket;

  private static rooms: Map<string, Map<string, WebSocket>> = new Map();

  constructor(options?: ServerOptions) {
    super();
    this.server = new WebSocketServer(options);

    this.server.on("connection", async (socket: WebSocket, request: IncomingMessage) => {
      this.socket = socket;
      this.emit(EventType.CONNECTION_ESTABLISHED, socket, request);

      socket.on("close", (code: number, reason: Buffer) => {
        this.emit(EventType.CONNECTION_CLOSED, socket, code, reason);
      });

      socket.on("message", (rawMessage: RawData, _isBinary: boolean) => {
        console.log({ got: "message", rawMessage });
        const { type, error, ...messageData } = this.tryParseRawMessage(rawMessage);
        if (error) {
          console.log({ error });
          return;
        }
        this.emit(type, messageData);
      });
    });
  }

  emitToClient(eventType: EventType, data: EventData) {
    if (!this.socket) {
      console.log("no socket");
      return;
    }
    const stringData = JSON.stringify({ type: eventType, ...data });
    console.log(stringData);
    console.log(this.socket);
    this.socket.send(stringData);
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
      // If room has no members in it, remove it..
      if (room.size === 0) {
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

  private tryParseRawMessage(rawMessage: RawData): WebSocketMessage {
    try {
      const message = JSON.parse(rawMessage.toString()) as WebSocketMessage;
      if (!message.type) {
        return new WebSocketMessage(EventType.ERROR, new Error("Message missing 'type' key"));
      }
      if (!(message.type in EventType)) {
        return new WebSocketMessage(EventType.ERROR, new Error("Unkown message type."));
      }
      return message;
    } catch (e) {
      console.error(e);
      return new WebSocketMessage(EventType.ERROR, e as Error);
    }
  }

  private async isAuthenticated(token: string) {
    if (!token) {
      return false;
    }
    try {
      const isValidToken = await verifyTokenAsync(token, process.env.JWT_SIGNATURE || "");
      if (!isValidToken) {
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }
}
