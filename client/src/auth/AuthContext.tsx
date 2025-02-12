import { createContext } from "react";
import { AuthContextValue } from "@client/types";

export default createContext<AuthContextValue>({
  user: null,
  session: null,
  attemptedValidation: false,
  validateSession: () => {},
  login: (_email: string, _password: string) => Promise.resolve(true),
  logout: () => {},
});
