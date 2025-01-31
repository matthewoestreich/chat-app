import React, { ReactNode, useState, useEffect } from "react";
import ThemeContext from "./ThemeContext";

interface ThemeProviderProperties {
  children: ReactNode;
}

export default function ThemeProvider(props: ThemeProviderProperties): React.JSX.Element {
  const LOCAL_STORAGE_KEY = "theme";
  const [theme, setTheme] = useState<ThemeMode>(getThemeFromLocalStorage());

  function getThemeFromLocalStorage(): ThemeMode {
    const currentTheme = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (currentTheme === "light") {
      return "light";
    }
    if (currentTheme === "dark") {
      return "dark";
    }
    // Light mode by default
    return "light";
  }

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, theme);
    document.documentElement.setAttribute("data-bs-theme", theme);
  }, [theme]);

  function toggleTheme(): void {
    if (theme === "light") {
      return setTheme("dark");
    }
    return setTheme("light");
  }

  // prettier-ignore
  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {props.children}
    </ThemeContext.Provider>
  );
}
