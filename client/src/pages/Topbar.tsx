import React, { DetailedHTMLProps, HTMLAttributes, useCallback, useEffect, useState } from "react";
import { DarkThemeIcon, LightThemeIcon } from "@components";
import { useAuth, useTheme } from "@hooks";

const INTENTIONAL_SPACE = " ";

interface TopbarProperties extends DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> {
  onLogout?: () => void;
}

export default function Topbar(props: TopbarProperties): React.JSX.Element {
  const [themeIcon, setThemeIcon] = useState<React.JSX.Element | null>(null);
  const { theme, toggleTheme } = useTheme();
  const { logout, session } = useAuth();

  const onLogout = props.onLogout;

  useEffect(() => {
    if (theme === "dark") {
      return setThemeIcon(<LightThemeIcon />);
    }
    if (theme === "light") {
      return setThemeIcon(<DarkThemeIcon />);
    }
    setThemeIcon(null);
  }, [theme]);

  const handleToggleTheme = useCallback(() => {
    toggleTheme();
  }, [toggleTheme]);

  const handleLogout = useCallback(() => {
    logout();
    if (onLogout) {
      onLogout();
    }
  }, [logout, onLogout]);

  return (
    <header className="navbar navbar-expand-lg fixed-top bg-secondary-subtle">
      <nav className="container">
        <div className="me-auto">
          <span className="navbar-brand">RTChat</span>
        </div>
        <div className="ms-auto g-1">
          <a onClick={handleToggleTheme} className="navbar-icon" title="Toggle theme">
            <button className="btn btn-light shadow">{themeIcon}</button>
          </a>
          {session !== null && (
            <>
              {INTENTIONAL_SPACE}
              <a className="navbar-icon" onClick={handleLogout}>
                <button className="btn btn-light flex-fill shadow" type="button" title="Logout">
                  <i className="bi bi-power"></i>
                </button>
              </a>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
