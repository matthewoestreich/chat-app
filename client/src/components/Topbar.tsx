import { useTheme } from "@hooks";
import React, { DetailedHTMLProps, HTMLAttributes, MouseEventHandler, useEffect, useState } from "react";

interface TopbarProperties extends DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> {
  onLogoutClick?: MouseEventHandler<HTMLAnchorElement>;
  showLogoutButton?: boolean;
}

export default function Topbar(props: TopbarProperties): React.JSX.Element {
  const { theme, toggleTheme } = useTheme();
  const [themeIcon, setThemeIcon] = useState<React.JSX.Element>(<></>);

  useEffect(() => {
    if (theme === "dark") {
      setThemeIcon(<i id="light-theme-icon" className="bi bi-sun-fill"></i>);
    } else if (theme === "light") {
      setThemeIcon(<i id="dark-theme-icon" className="bi bi-moon-fill"></i>);
    } else {
      setThemeIcon(<></>);
    }
  }, [theme]);

  return (
    <header className="navbar navbar-expand-lg fixed-top bg-secondary-subtle">
      <nav className="container">
        <div className="me-auto">
          <span className="navbar-brand">RTChat</span>
        </div>
        <div className="mx-auto">
          <a className="navbar-icon d-inline-block d-lg-none" data-bs-toggle="offcanvas" data-bs-target="#members-offcanvas">
            <button className="btn btn-primary shadow" type="button" title="View Members">
              <i className="bi bi-people-fill"></i>
            </button>
          </a>
          <></>
          <a className="navbar-icon d-inline-block d-lg-none">
            <button className="btn btn-primary shadow" type="button" title="View Rooms" data-bs-toggle="offcanvas" data-bs-target="#rooms-offcanvas">
              <i className="bi bi-door-open-fill"></i>
            </button>
          </a>
        </div>
        <div className="ms-auto g-1">
          <a onClick={() => toggleTheme()} className="navbar-icon" title="Toggle theme">
            <button className="btn btn-light shadow">{themeIcon}</button>
          </a>
          {props.showLogoutButton === true ||
            (props.showLogoutButton === undefined && (
              <>
                {" "}
                <a className="navbar-icon" onClick={props.onLogoutClick}>
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
