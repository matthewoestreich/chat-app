import EventType from "./EventType";

export default class WebSocketMessage implements IWebSocketMessage {
  type: EventType;
  error?: Error | string;
  [key: string]: any;

  static from(data: ArrayBuffer | Buffer[] | string) {
    const { type, ...rest } = JSON.parse(String(data));
    return new WebSocketMessage(type, rest);
  }

  constructor(type: EventType, data: IWebSocketMessageData);
  constructor(type: EventType, error: Error | string);
  constructor(type: EventType, arg: Error | string | IWebSocketMessageData) {
    this.type = type;
    if (arg instanceof Error || typeof arg === "string") {
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
