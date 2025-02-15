import { createContext } from "react";
import { ThemeContextValue, ThemeMode } from "@client/types";

export default createContext<ThemeContextValue>({
  theme: "light",
  setTheme: (_mode: ThemeMode) => {},
  toggleTheme: () => {},
});
