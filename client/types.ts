import type { IncomingMessage } from "node:http";
import { Cookies, Cookie } from "../types.shared";

export interface UseCookie {
  setCookie(name: string, value: string, days: number, path?: string): void;
  getAllCookies(): Cookies;
  getCookie(name: string): Cookie | undefined;
  clearAllCookies(): void;
  clearCookie(name: string, path: string): boolean;
}

export interface AlertState {
  type: BootstrapContextualClasses | null;
  shown: boolean;
  message?: string;
  icon: string | null;
}

export interface AuthenticationResult {
  ok: boolean;
  session?: string;
  id?: string;
  name?: string;
  email?: string;
}

export interface CreateAccountResult {
  ok: boolean;
  id?: string;
  name?: string;
  email?: string;
}

export interface LogoutResult {
  ok: boolean;
  status: number;
}

export interface UserData {
  id: string;
  name: string;
  email: string;
}

export interface AuthContextValue {
  user: UserData | null;
  session: string | null;
  validateSession: () => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export type BootstrapContextualClasses = "primary" | "secondary" | "success" | "danger" | "warning" | "info" | "light" | "dark";

export type ThemeMode = "light" | "dark";

export interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

export interface WebSocketeerEventMap {
  // eslint-disable-next-line
  [K: symbol]: { [K: string]: any } | any;
}

export type WebSocketeerEventType<T extends WebSocketeerEventMap> = keyof T;
export type WebSocketeerEventPayload<T extends WebSocketeerEventMap, K extends WebSocketeerEventType<T>> = T[K];

export type WebSocketeerEventHandlerMapArray<T extends WebSocketeerEventMap> = {
  [K in keyof T]?: ((payload: T[K]) => void)[];
};

export type WebSocketeerEventHandlerMap<T extends WebSocketeerEventMap> = {
  [K in keyof T]?: (payload: T[K]) => void;
};

export type WebSocketeerParsedMessage<T> = {
  type: keyof T;
  payload: T[keyof T];
};

export type EventMap = {
  [key: string]: (...args: any[]) => void;
};

export interface TypedEventEmitter<Events extends EventMap> {
  addListener<E extends keyof Events>(event: E, listener: Events[E]): this;
  on<E extends keyof Events>(event: E, listener: Events[E]): this;
  once<E extends keyof Events>(event: E, listener: Events[E]): this;
  prependListener<E extends keyof Events>(event: E, listener: Events[E]): this;
  prependOnceListener<E extends keyof Events>(event: E, listener: Events[E]): this;

  off<E extends keyof Events>(event: E, listener: Events[E]): this;
  removeAllListeners<E extends keyof Events>(event?: E): this;
  removeListener<E extends keyof Events>(event: E, listener: Events[E]): this;

  emit<E extends keyof Events>(event: E, ...args: Parameters<Events[E]>): boolean;
  // The sloppy `eventNames()` return export type is to mitigate export type incompatibilities - see #5
  eventNames(): (keyof Events | string | symbol)[];
  rawListeners<E extends keyof Events>(event: E): Events[E][];
  listeners<E extends keyof Events>(event: E): Events[E][];
  listenerCount<E extends keyof Events>(event: E): number;

  getMaxListeners(): number;
  setMaxListeners(maxListeners: number): this;
}

export interface WebSocketeerEvents extends EventMap {
  CONNECTION_ESTABLISHED: (error: Error | null, request: IncomingMessage) => void;
}
