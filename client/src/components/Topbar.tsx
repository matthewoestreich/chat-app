import { useAuth, useTheme } from "@hooks";
import React, { DetailedHTMLProps, HTMLAttributes, useEffect, useState } from "react";

interface TopbarProperties extends DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> {
  showLogoutButton?: boolean;
}

function LightThemeIcon(): React.JSX.Element {
  return <i id="light-theme-icon" className="bi bi-sun-fill"></i>;
}

function DarkThemeIcon(): React.JSX.Element {
  return <i id="dark-theme-icon" className="bi bi-moon-fill"></i>;
}

export default function Topbar(props: TopbarProperties): React.JSX.Element {
  const [themeIcon, setThemeIcon] = useState<React.JSX.Element>(<></>);
  const { theme, toggleTheme } = useTheme();
  const { logout, session } = useAuth();

  useEffect(() => {
    if (theme === "dark") {
      setThemeIcon(<LightThemeIcon />);
    } else if (theme === "light") {
      setThemeIcon(<DarkThemeIcon />);
    } else {
      setThemeIcon(<></>);
    }
  }, [theme]);

  function handleLogout(): void {
    logout();
  }

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
          <a onClick={() => toggleTheme()} className="navbar-icon" title="Toggle theme">
            <button className="btn btn-light shadow">{themeIcon}</button>
          </a>
          {props.showLogoutButton === true ||
            (props.showLogoutButton === undefined && (
              <>
                {" " /* THIS SPACE IS INTENTIONAL */}
                <a className="navbar-icon" onClick={handleLogout}>
                  <button className="btn btn-light flex-fill shadow" type="button" title="Logout">
                    <i className="bi bi-power"></i>
                  </button>
                </a>
              </>
            ))}
        </div>
      </nav>
    </header>
  );
}
