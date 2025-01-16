import { WebSocket } from "ws";
import WebSocketMessage from "./WebSocketMessage";
import WebSocketApp from "./WebSocketApp";

export default class WebSocketClient {
  private _socket: WebSocket;
  get socket() {
    return this._socket;
  }

  private _user: Account;
  get user() {
    return this._user;
  }
  set user(account: Account) {
    this._user = account;
  }

  private _activeIn: CachedContainer;
  get activeIn() {
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
