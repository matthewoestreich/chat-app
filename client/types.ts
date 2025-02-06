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
  userName?: string;
  email?: string;
}

export interface CreateAccountResult {
  ok: boolean;
  id?: string;
  userName?: string;
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
  user: AuthenticatedUser | null;
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
