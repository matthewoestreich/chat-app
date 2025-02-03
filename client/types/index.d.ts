interface BootstrapFormMethods {
  submitForm: () => void;
  setIsValid: (isValid: boolean) => void;
}

interface AlertState {
  type?: BootstrapContextualClasses;
  shown: boolean;
  message?: string;
  icon?: string;
}

interface AuthenticationResult {
  ok: boolean;
  session?: string;
  id?: string;
  name?: string;
  email?: string;
}

interface CreateAccountResult {
  ok: boolean;
  id?: string;
  name?: string;
  email?: string;
}

interface CreateRoomResult {
  name: string; // ?? not sure what all i need yet
  id: string;
}

interface LogoutResult {
  ok: boolean;
  status: number;
}

interface UserData {
  id: string;
  name: string;
  email: string;
}

interface AuthContextValue {
  user: UserData | null;
  session: string | null;
  validateSession: () => void;
  login: (email: string, password: string) => void;
  logout: () => void;
}

type BootstrapContextualClasses = "primary" | "secondary" | "success" | "danger" | "warning" | "info" | "light" | "dark";

type ThemeMode = "light" | "dark";

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

declare class WebSocketeer<T extends WebSocketeerEventMap> {
  constructor(url: string);
  url: string;
  connect(): void;
  onOpen(handler: (e: Event) => void): void;
  onClose(handler: (e: CloseEvent) => void): void;
  onError(handler: (e: Event) => void): void;
  on<K extends WebSocketeerEventType<T>>(event: K, handler: (payload: WebSocketeerEventPayload<T, K>) => void): void;
  emit<K extends keyof T>(event: K, payload: T[K]): void;
  // eslint-disable-next-line
  send<K extends WebSocketeerEventType<T>>(event: K, ...payload: T[K] extends Record<string, any> ? [T[K]] : []): void;
}

interface WebSocketeerContextValue<T extends WebSocketeerEventMap> {
  websocketeer: WebSocketeer<T>;
}

interface WebSocketeerEventMap {
  // eslint-disable-next-line
  [K: symbol]: { [K: string]: any } | any;
}

type WebSocketeerEventType<T extends WebSocketeerEventMap> = keyof T;
type WebSocketeerEventPayload<T extends WebSocketeerEventMap, K extends WebSocketeerEventType<T>> = T[K];

type WebSocketeerEventHandlerMap<T extends WebSocketeerEventMap> = {
  [K in keyof T]?: ((payload: T[K]) => void)[];
};

type WebSocketeerParsedMessage<T> = {
  type: keyof T;
  payload: T[keyof T];
};
