import WebSocketeerMessage from "./WebSocketeerMessage";

export default class WebSocketeer<T extends WebSocketeerEventMap> {
  private socket: WebSocket | null = null;
  private nativeSocketDefaultEventHandlers = {
    onOpen: (_e: Event): void => {},
    onClose: (_e: CloseEvent): void => {},
    onError: (_e: Event): void => {},
  };

  protected handlers: WebSocketeerEventHandlerMap<T> = {};

  public url: string;

  constructor(url: string) {
    this.url = url;
  }

  // eslint-disable-next-line
  private parseRawMessage(data: any): WebSocketeerMessage<T> {
    return WebSocketeerMessage.from<T>(data);
  }

  public connect(): void {
    this.socket = new WebSocket(this.url);

    this.socket.addEventListener("open", (e: Event) => {
      this.nativeSocketDefaultEventHandlers.onOpen(e);
    });

    this.socket.addEventListener("close", (e: CloseEvent) => {
      this.nativeSocketDefaultEventHandlers.onClose(e);
    });

    this.socket.addEventListener("error", (e: Event) => {
      this.nativeSocketDefaultEventHandlers.onError(e);
    });

    this.socket.addEventListener("message", (event: MessageEvent) => {
      console.log({ on: "message", rawEvent: event });
      const { type, payload } = this.parseRawMessage(event.data);
      console.log({ type, payload });
      if (!type) {
        throw new Error("Message missing type");
      }
      this.emit(type, payload);
    });
  }

  public onOpen(handler: (e: Event) => void): void {
    this.nativeSocketDefaultEventHandlers.onOpen = handler;
  }
  public onClose(handler: (e: CloseEvent) => void): void {
    this.nativeSocketDefaultEventHandlers.onClose = handler;
  }
  public onError(handler: (e: Event) => void): void {
    this.nativeSocketDefaultEventHandlers.onError = handler;
  }

  public on<K extends WebSocketeerEventType<T>>(event: K, handler: (payload: WebSocketeerEventPayload<T, K>) => void): void {
    if (!this.handlers[event]) {
      this.handlers[event] = [];
    }
    //(this.handlers[event] as ((payload: T[K]) => void)[]).push(handler);
    this.handlers[event].push(handler);
  }

  public emit<E extends keyof T>(event: E, payload: T[E]): void {
    const handlers = this.handlers[event];
    if (handlers) {
      for (const handler of handlers) {
        handler(payload);
      }
    }
  }

  // eslint-disable-next-line
  public send<K extends WebSocketeerEventType<T>>(event: K, ...payload: T[K] extends Record<string, any> ? [T[K]] : []): void {
    if (!this.socket) {
      return console.warn("Socket is empty. Have you called `listen()` yet?");
    }
    const message: { type: K; payload?: T[K] } = { type: event };
    if (payload.length > 0) {
      message.payload = payload[0];
    }
    this.socket.send(JSON.stringify(message));
  }
}
