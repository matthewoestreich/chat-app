interface ModalMethods {
  show: () => void;
  hide: () => void;
}

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

interface LoginResult {
  ok: boolean;
  session: string;
}

interface AutoLoginCheckResult {
  ok: boolean;
  redirectTo: string;
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
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

type BootstrapContextualClasses = "primary" | "secondary" | "success" | "danger" | "warning" | "info" | "light" | "dark";
