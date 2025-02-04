import { createContext } from "react";

export default createContext<AuthContextValue>({
  user: null,
  session: null,
  validateSession: () => {},
  login: (_email: string, _password: string) => {},
  logout: () => {},
});
