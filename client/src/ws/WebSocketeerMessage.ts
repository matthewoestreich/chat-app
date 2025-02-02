export default class WebSocketeerMessage<T extends WebSocketeerEventMap> {
  public type: keyof T;
  public payload: T[keyof T];

  constructor(type: keyof T, payload: T[keyof T]) {
    this.type = type;
    this.payload = payload;
  }

  // eslint-disable-next-line
  public static from<T extends WebSocketeerEventMap>(data: any): WebSocketeerMessage<T> {
    const { type, ...payload } = JSON.parse(data);
    return new WebSocketeerMessage(type, payload);
  }
}
