import { createContext } from "react";

export default createContext<AuthContextValue>({
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});
