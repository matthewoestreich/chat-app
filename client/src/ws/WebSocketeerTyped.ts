export default class WebSocketeerTyped<T extends EventMap> implements TypedEventEmitter<T> {
  addListener<E extends keyof T>(event: E, listener: T[E]): this {
    throw new Error("Method not implemented.");
  }
  on<E extends keyof T>(event: E, listener: T[E]): this {
    throw new Error("Method not implemented.");
  }
  once<E extends keyof T>(event: E, listener: T[E]): this {
    throw new Error("Method not implemented.");
  }
  prependListener<E extends keyof T>(event: E, listener: T[E]): this {
    throw new Error("Method not implemented.");
  }
  prependOnceListener<E extends keyof T>(event: E, listener: T[E]): this {
    throw new Error("Method not implemented.");
  }
  off<E extends keyof T>(event: E, listener: T[E]): this {
    throw new Error("Method not implemented.");
  }
  removeAllListeners<E extends keyof T>(event?: E | undefined): this {
    throw new Error("Method not implemented.");
  }
  removeListener<E extends keyof T>(event: E, listener: T[E]): this {
    throw new Error("Method not implemented.");
  }
  emit<E extends keyof T>(event: E, ...args: Parameters<T[E]>): boolean {
    throw new Error("Method not implemented.");
  }
  eventNames(): (string | symbol | keyof T)[] {
    throw new Error("Method not implemented.");
  }
  rawListeners<E extends keyof T>(event: E): T[E][] {
    throw new Error("Method not implemented.");
  }
  listeners<E extends keyof T>(event: E): T[E][] {
    throw new Error("Method not implemented.");
  }
  listenerCount<E extends keyof T>(event: E): number {
    throw new Error("Method not implemented.");
  }
  getMaxListeners(): number {
    throw new Error("Method not implemented.");
  }
  setMaxListeners(maxListeners: number): this {
    throw new Error("Method not implemented.");
  }
}
