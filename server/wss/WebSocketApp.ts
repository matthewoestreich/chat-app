import EventEmitter from "node:events";
import { IncomingMessage } from "node:http";
import { WebSocketServer, WebSocket, ServerOptions, RawData } from "ws";
import WebSocketMessage from "./WebSocketMessage";
import EventType from "./EventType";

/**
 * Wrapper around WebSocketServer that emits events based on WebSocket message(s).
 */
export default class WebSocketApp extends EventEmitter {
  private server: WebSocketServer;
  private socket: WebSocket;

  private static rooms: Map<string, Map<string, WebSocket>> = new Map();

  /**
   * Parses a raw incoming websocket message.
   *
   * @param rawMessage
   * @returns {WebSocketMessage}
   */
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
        this.emit(type, this.socket, data);
      });
    });
  }

  // For when someone first logs in or what not and they aren't in a room, but they're online.
  static ROOM_ID_UNASSIGNED: string = "__UNASSIGNED__";

  /**
   * Wrapper for calling `this.socket.send`.
   *
   * @param message Message to sned to the current socket (this.socket)
   */
  emitToClient(message: WebSocketMessage): void {
    this.socket.send(message.toJSONString());
  }

  /**
   * Send a message "directly" to another socket (vs to current socket (aka `this.socket`)).
   * Useful for brokering direct messages.
   *
   * @param socket Socket to send message to.
   * @param message Message to send
   */
  emitToSocket(socket: WebSocket, message: WebSocketMessage): void {
    socket.send(message.toJSONString());
  }

  /**
   * *IMPORTANT*; `broadcast` offers no protection against spoofing, etc..
   * If you need these protections, implement them prior to calling `broadcast`.
   * Sends a message to every socket that is in a cached room.
   *
   * @param toRoomId
   * @param message
   */
  broadcast(toRoomId: string, message: WebSocketMessage): void {
    if (toRoomId === WebSocketApp.ROOM_ID_UNASSIGNED) {
      return;
    }

    const room = this.getCachedRoom(toRoomId);
    if (!room) {
      return;
    }

    for (const [_userId, userSocket] of room) {
      this.emitToSocket(userSocket, message);
    }
  }

  /**
   * Get a room from our room cache.
   *
   * @param roomId ID of room to get.
   * @returns {Map<string, WebSocket> | undefined}
   */
  getCachedRoom(roomId: string): Map<string, WebSocket> | undefined {
    return WebSocketApp.rooms.get(roomId);
  }

  /**
   * Deletes a room from our room cache.
   *
   * @param roomId ID of room to delete.
   */
  removeCachedRoom(roomId: string): void {
    WebSocketApp.rooms.delete(roomId);
  }

  /**
   * Removes user from room, if they exist in said room,
   * oherwise we do nothing. No error is thrown.
   *
   * @param userId ID of user to remove
   * @param roomId ID of room that user is currently in
   */
  removeCachedUserFromRoom(userId: string, roomId: string): void {
    const room = this.getCachedRoom(roomId);
    if (room && room.has(userId)) {
      room.delete(userId);
      if (room.size === 0) {
        this.removeCachedRoom(roomId);
      }
    }
  }

  /**
   * Essentially checks if a user is active or not.
   *
   * @param userId ID of user that we check for.
   * @returns {boolean}
   */
  cacheContainsUser(userId: string): boolean {
    for (const [_roomId, userMap] of WebSocketApp.rooms) {
      if (userMap.has(userId)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Creates a room within our "rooms" cache if it doesn't exist.
   *
   * @param roomId ID of room to cache
   */
  cacheRoom(roomId: string): void {
    if (!WebSocketApp.rooms.has(roomId)) {
      WebSocketApp.rooms.set(roomId, new Map());
    }
  }

  /**
   * Will create a room if it doesn't exist and add a user + socket (this.socket) to it.
   *
   * @param userId ID of user to cache
   * @param roomId ID of room to cache user in
   */
  cacheUserInRoom(userId: string, roomId: string): void {
    if (!this.socket) {
      return;
    }
    this.cacheRoom(roomId);
    this.getCachedRoom(roomId)!.set(userId, this.socket);
  }
}
