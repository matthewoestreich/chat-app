import EventType from "./EventType";

export default class WebSocketMessage implements IWebSocketMessage {
  type: EventType;
  error: Error | string | undefined;
  [key: string]: any;

  constructor(type: EventType, error?: Error | string, ...rest: IWebSocketMessageData[]);
  constructor(type: EventType, ...args: (IWebSocketMessageData | Error | string | undefined)[]) {
    const [error, ...rest] = args;
    this.type = type;

    if (error instanceof Error || typeof error === "string") {
      this.error = error;
    }

    for (const [key, value] of Object.entries(rest as IWebSocketMessageData[])) {
      this[key] = value;
    }
  }
}
