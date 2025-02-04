import { createContext } from "react";

export default createContext<ThemeContextValue>({
  theme: "light",
  setTheme: (_mode: ThemeMode) => {},
  toggleTheme: () => {},
});
