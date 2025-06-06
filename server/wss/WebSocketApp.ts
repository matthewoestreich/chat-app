import EventEmitter from "node:events";
import { IncomingMessage } from "node:http";
import { WebSocketServer, WebSocket, ServerOptions, RawData } from "ws";
import WebSocketMessage from "./WebSocketMessage";
import { EventTypeMissingError } from "../errors";
import WebSocketClient from "./WebSocketClient";
import { Container, EventPayload, EventTypes, WebSocketAppCache, WebSocketAppCatchHandler } from "../types";

/**
 * Wrapper around WebSocketServer that emits events based on WebSocket message(s).
 *
 * Must call `.listen` to actually start WebSocketApp!!
 * For example:
 *  const mywsapp = new WebSocketApp();
 *  mywsapp.listen(options, () => { console.log(`mywsapp listening`) });
 */
export default class WebSocketApp extends EventEmitter {
  private server: WebSocketServer;
  private catchFn: WebSocketAppCatchHandler = (_error: Error, _client: WebSocketClient) => {};
  //Look at cache as containers that hold items. For example, chat rooms that hold members/users.
  private static cache: WebSocketAppCache = new Map();
  public static get appCache(): WebSocketAppCache {
    return WebSocketApp.cache;
  }

  /**
   * Parses a raw incoming websocket message.
   * @param rawMessage
   * @returns {WebSocketMessage}
   */
  private parseRawMessage(rawMessage: RawData): WebSocketMessage<EventTypes> {
    try {
      const message = WebSocketMessage.from(rawMessage);

      if (!message.type) {
        throw new EventTypeMissingError({ message: "Message missing 'type' key" });
      }

      return message;
    } catch (e) {
      throw e;
    }
  }

  constructor() {
    super();
    WebSocketApp.cache.set(WebSocketApp.ID_UNASSIGNED, new Map());
  }

  listen(options: ServerOptions, callback?: () => void): void {
    this.server = new WebSocketServer(options);

    this.server.on("connection", async (socket: WebSocket, request: IncomingMessage) => {
      const client = new WebSocketClient(socket);

      this.emit("CONNECTION_ESTABLISHED", client, { request });

      socket.on("close", (code: number, reason: Buffer) => {
        this.emit("CONNECTION_CLOSED", client, { code, reason });
      });

      socket.on("message", (rawMessage: RawData, _isBinary: boolean) => {
        try {
          const { type, ...data } = this.parseRawMessage(rawMessage);
          this.emit(type, client, data || {});
        } catch (e) {
          this.catchFn(e as Error, client);
        }
      });
    });

    if (callback) {
      callback();
    }
  }

  /**
   * Blasts a message to every single socket.
   * @param type Message type
   * @param payload Message payload
   */
  blast<K extends EventTypes>(type: K, payload: EventPayload<K>, excludeClient?: WebSocketClient): void {
    for (const [_containerId, container] of WebSocketApp.cache) {
      for (const [_clientId, client] of container) {
        if (excludeClient && client === excludeClient) {
          continue;
        }
        client.send(type, payload);
      }
    }
  }

  on<K extends EventTypes>(event: K, handler: (client: WebSocketClient, payload: EventPayload<K>) => void): this {
    return super.on(event, handler);
  }

  emit<K extends EventTypes>(event: K, client: WebSocketClient, payload: EventPayload<K>): boolean {
    return super.emit(event, client, payload);
  }

  // Close the WebSocketServer
  shutdown(): void {
    this.server.close();
  }

  // Error handling
  catch(handler: WebSocketAppCatchHandler): void {
    this.catchFn = handler;
  }

  // For when someone first logs in or what not and they aren't in a room, but they're online.
  // Should be 36 chars long to satisfy database requirements.
  static ID_UNASSIGNED: string = "_____________UNASSIGNED_____________";

  /**
   * Get a 'container' from our room cache.
   * @param containerId ID of container to get.
   */
  getCachedContainer(containerId: string): Container {
    return WebSocketApp.cache.get(containerId) || new Map();
  }

  /**
   * Deletes a container from cache.
   * @param containerId ID of container to delete.
   */
  deleteCachedContainer(containerId: string): void {
    WebSocketApp.cache.delete(containerId);
  }

  /**
   * Returns a cached client, if exists, otherwise, returns null.
   * @param id : the id of the cached item.
   * @returns
   */
  getCachedItem(id: string): WebSocketClient | null {
    for (const [_containerId, container] of WebSocketApp.cache) {
      if (container.has(id)) {
        return container.get(id)!;
      }
    }
    return null;
  }

  /**
   * Removes item from container, if they exist in said container,
   * oherwise we do nothing. No error is thrown.
   * @param itemId ID of item to remove
   * @param containerId ID of container that item is currently in
   */
  deleteCachedItem(itemId: string, containerId: string): void {
    const container = this.getCachedContainer(containerId);

    if (container && container.has(itemId)) {
      container.delete(itemId);
      if (container.size === 0) {
        WebSocketApp.cache.delete(containerId);
      }
    }
  }

  /**
   * Essentially checks if an item exists in any cached container.
   * @param itemId ID of item that we check for.
   * @returns {boolean}
   */
  isItemCached(itemId: string): boolean {
    for (const [_, container] of WebSocketApp.cache) {
      if (container.has(itemId)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Checks if a container with given ID is cached.
   * @param containerId ID of container
   */
  isContainerCached(containerId: string): boolean {
    return WebSocketApp.cache.has(containerId);
  }

  /**
   * Creates a container within our cache if it doesn't exist.
   * @param containerId ID of room to cache
   */
  addContainerToCache(containerId: string): void {
    if (this.isContainerCached(containerId)) {
      return;
    }
    WebSocketApp.cache.set(containerId, new Map());
  }

  /**
   * Will create a container if it doesn't exist and add an item to it.
   * Also adds socket to item (this.socket)
   * @param client Client to cache
   * @param containerId ID of room to cache user in
   */
  addClientToCache(client: WebSocketClient, containerId: string): Container {
    this.addContainerToCache(containerId);
    return this.getCachedContainer(containerId)!.set(client.user.id, client);
  }
}
