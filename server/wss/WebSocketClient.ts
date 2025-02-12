import { WebSocket } from "ws";
import WebSocketMessage from "./WebSocketMessage";
import WebSocketApp from "./WebSocketApp";
import { CachedContainer, Container, EventPayload, EventTypes } from "../types";
import { PublicMessage, User } from "@root/types.shared";

export default class WebSocketClient {
  private _socket: WebSocket;
  get socket(): WebSocket {
    return this._socket;
  }

  private _user: AuthenticatedUser | User;
  get user(): AuthenticatedUser | User {
    return this._user;
  }
  set user(account: AuthenticatedUser | User) {
    this._user = account;
  }

  private _activeIn: CachedContainer;
  get activeIn(): CachedContainer {
    return this._activeIn;
  }

  constructor(socket: WebSocket) {
    this._socket = socket;
  }

  setActiveIn(id: string, container: Container): void {
    this._activeIn = { id, container };
  }

  send<K extends EventTypes>(type: K, payload: EventPayload<K>): void {
    this._socket.send(new WebSocketMessage(type, payload).toJSONString());
  }

  sendDirectMessage(toClient: WebSocketClient, message: PublicMessage): void {
    toClient.send("RECEIVE_MESSAGE", { message });
  }

  broadcast<K extends EventTypes>(type: K, payload: EventPayload<K>): void {
    if (this.activeIn.id === WebSocketApp.ID_UNASSIGNED) {
      return;
    }

    const room = this.activeIn.container;
    if (!room) {
      return;
    }

    for (const [userId, userClient] of room) {
      // Don't send message back to ourselves..
      if (this._user.id === userId) {
        continue;
      }
      userClient.send(type, payload);
    }
  }
}
