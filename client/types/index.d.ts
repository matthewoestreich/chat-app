interface AlertState {
  type: BootstrapContextualClasses | null;
  shown: boolean;
  message?: string;
  icon: string | null;
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
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

type BootstrapContextualClasses = "primary" | "secondary" | "success" | "danger" | "warning" | "info" | "light" | "dark";

type ThemeMode = "light" | "dark";

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
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
