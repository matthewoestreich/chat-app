interface ModalMethods {
  show: () => void;
  hide: () => void;
}

interface LoginResult {
  ok: boolean;
  session: string;
}

type BootstrapContextualClasses = "primary" | "secondary" | "success" | "danger" | "warning" | "info" | "light" | "dark";
