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

interface JoinRoomResult {
  name: string;
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
