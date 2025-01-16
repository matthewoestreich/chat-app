import { RawData } from "ws";

export default class WebSocketMessage<K extends EventTypes> {
  type: K;
  [key: string]: any;

  static from(rawData: RawData): WebSocketMessage<keyof WebSocketAppEventRegistry> {
    const { type, ...data } = JSON.parse(rawData.toString());
    return new WebSocketMessage(type, data);
  }

  constructor(type: K, payload: EventPayload<K>) {
    this.type = type;
    Object.assign(this, payload);
  }

  toJSONString() {
    return JSON.stringify(this);
  }
}
