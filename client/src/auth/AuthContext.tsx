import { createContext } from "react";
import { AuthContextValue } from "../../types";

export default createContext<AuthContextValue>({
  user: null,
  session: null,
  validateSession: () => {},
  login: (_email: string, _password: string) => Promise.resolve(true),
  logout: () => {},
});
