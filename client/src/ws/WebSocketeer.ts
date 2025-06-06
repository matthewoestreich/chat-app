import {
  WebSocketeerEventHandler,
  WebSocketeerEventHandlerMapArray,
  WebSocketeerEventMap,
  WebSocketeerEventType,
  WebSocketeerParsedMessage,
} from "@client/types";

export default class WebSocketeer<T extends WebSocketeerEventMap> {
  private handlers: WebSocketeerEventHandlerMapArray<T> = {};
  private socket: WebSocket | null = null;
  private nativeSocketDefaultEventHandlers = {
    onOpen: (_e: Event): void => {},
    onClose: (_e: CloseEvent): void => {},
    onError: (_e: Event): void => {},
  };

  public url: string;

  // eslint-disable-next-line
  private parseRawMessage(data: any): WebSocketeerParsedMessage<T> {
    const { type, ...payload } = JSON.parse(data);
    return { type, payload };
  }

  constructor(url: string) {
    this.url = url;
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
      const { type, payload } = this.parseRawMessage(event.data);
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

  public on<K extends WebSocketeerEventType<T>>(event: K, handler: WebSocketeerEventHandler<T, K>): void {
    if (!this.handlers[event]) {
      this.handlers[event] = [];
    }
    this.handlers[event].push(handler);
  }

  public off<K extends WebSocketeerEventType<T>>(event: K, handler: WebSocketeerEventHandler<T, K>): void {
    const handlers = this.handlers[event];
    if (!handlers) {
      return;
    }
    const idx = handlers.findIndex((h) => h === handler);
    if (idx === -1) {
      return;
    }
    handlers.splice(idx, 1);
    if (handlers.length === 0) {
      delete this.handlers[event];
    }
  }

  public emit<K extends keyof T>(event: K, payload: T[K]): void {
    const handlers = this.handlers[event];
    if (handlers) {
      for (const handler of handlers) {
        handler(payload);
      }
    }
  }

  // For the `payload` param : `...payload: T[K] extends Record<string, any> ? [T[K]] : []` : that essentially just
  // means to make the `payload` param optional if the payload for "that" event is `unknown`.
  // - So you DON'T have to do: `websocketeer.send("EVENT_THAT_DOESNT_HAVE_PAYLOAD", {})`
  // - And can just do : `websocketeer.send("EVENT_THAT_DOESNT_HAVE_PAYLOAD")`
  // eslint-disable-next-line
  public send<K extends WebSocketeerEventType<T>>(event: K, ...payload: T[K] extends Record<string, any> ? [T[K]] : []): void {
    if (!this.socket) {
      return console.warn("Socket is empty. Have you called `listen()` yet?");
    }
    this.socket.send(JSON.stringify({ type: event, ...payload[0] }));
  }

  public getEventHandlers<K extends WebSocketeerEventType<T>>(event: K): WebSocketeerEventHandler<T, K>[] | undefined {
    return this.handlers[event];
  }
}
