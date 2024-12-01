import { RawData } from "ws";
import EventType from "./EventType";

export default class WebSocketMessage implements IWebSocketMessage {
  type: EventType;
  [key: string]: any;

  static from(rawData: RawData): WebSocketMessage {
    const { type, data } = JSON.parse(rawData.toString());
    return new WebSocketMessage(type, data);
  }

  constructor(type: EventType, data: IWebSocketMessageData) {
    this.type = type;
    Object.assign(this, data);
  }

  toJSONString() {
    return JSON.stringify(this);
  }
}
/*
export default class WebSocketMessage implements IWebSocketMessage {
  type: EventType;
  error?: Error;
  [key: string]: any;

  static from(data: ArrayBuffer | Buffer[] | string) {
    const { type, ...rest } = JSON.parse(String(data));
    return new WebSocketMessage(type, rest);
  }

  constructor(type: EventType, data: IWebSocketMessageData);
  constructor(type: EventType, error: Error);
  constructor(type: EventType, arg: Error | IWebSocketMessageData) {
    this.type = type;
    if (arg instanceof Error) {
      this.error = arg;
      return;
    }
    if (typeof arg === "object" && arg !== null) {
      Object.assign(this, arg);
      return;
    }
  }

  toJSONString() {
    return JSON.stringify(this);
  }
}
*/
