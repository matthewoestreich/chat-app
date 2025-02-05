import React, { DetailedHTMLProps, HTMLAttributes, useCallback, useEffect, useState } from "react";
import { DarkThemeIcon, LightThemeIcon } from "@components";
import { useAuth, useTheme } from "@hooks";

interface TopbarProperties extends DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> {}

export default function Topbar(_props: TopbarProperties): React.JSX.Element {
  const [themeIcon, setThemeIcon] = useState<React.JSX.Element | null>(null);
  const { theme, toggleTheme } = useTheme();
  const { logout, session } = useAuth();

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
  }, [logout]);

  return (
    <header className="navbar navbar-expand-lg fixed-top bg-secondary-subtle">
      <nav className="container">
        <div className="me-auto">
          <span className="navbar-brand">RTChat</span>
        </div>
        {session !== null && (
          <div className="mx-auto">
            <a className="navbar-icon d-inline-block d-lg-none" data-bs-toggle="offcanvas" data-bs-target="#members-offcanvas">
              <button className="btn btn-secondary shadow" type="button" title="View Members">
                <i className="bi bi-people-fill"></i>
              </button>
            </a>
            {" " /* THIS SPACE IS INTENTIONAL */}
            <a className="navbar-icon d-inline-block d-lg-none" data-bs-toggle="offcanvas" data-bs-target="#rooms-offcanvas">
              <button className="btn btn-secondary shadow" type="button" title="View Rooms">
                <i className="bi bi-door-open-fill"></i>
              </button>
            </a>
          </div>
        )}
        <div className="ms-auto g-1">
          <a onClick={handleToggleTheme} className="navbar-icon" title="Toggle theme">
            <button className="btn btn-light shadow">{themeIcon}</button>
          </a>
          {session !== null && (
            <>
              {" " /* THIS SPACE IS INTENTIONAL */}
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
