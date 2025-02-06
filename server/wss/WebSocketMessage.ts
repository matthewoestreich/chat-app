import { RawData } from "ws";
import { EventPayload, EventTypes } from "../types";

export default class WebSocketMessage<K extends EventTypes> {
  type: K;
  // eslint-disable-next-line
  [key: string]: any;

  static from(rawData: RawData): WebSocketMessage<EventTypes> {
    const { type, ...data } = JSON.parse(rawData.toString());
    return new WebSocketMessage(type, data);
  }

  constructor(type: K, payload: EventPayload<K>) {
    this.type = type;
    Object.assign(this, payload);
  }

  toJSONString(): string {
    return JSON.stringify(this);
  }
}
