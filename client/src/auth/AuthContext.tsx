import { createContext } from "react";

export default createContext<AuthContextValue>({
  user: null,
  session: null,
  validateSession: () => Promise.resolve(),
  login: (_email: string, _password: string) => {},
  logout: () => {},
});
