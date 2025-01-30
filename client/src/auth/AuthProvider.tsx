import React, { ReactNode, useState } from "react";
import AuthContext from "./AuthContext";

interface AuthProviderProperties {
  children: ReactNode;
}

export default function AuthProvider(props: AuthProviderProperties): React.JSX.Element {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  function login(): void {
    setIsAuthenticated(true);
  }

  function logout(): void {
    setIsAuthenticated(false);
  }

  return <AuthContext.Provider value={{ isAuthenticated, login, logout }}>{props.children}</AuthContext.Provider>;
}
