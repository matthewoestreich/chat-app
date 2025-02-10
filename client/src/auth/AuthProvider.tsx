import React, { ReactNode, useState } from "react";
import AuthContext from "./AuthContext";
import { useNavigate } from "react-router-dom";
import { sendLoginRequest, sendLogoutRequest, sendValidateRequest } from "./authService";
import { useCookies } from "@hooks";

interface AuthProviderProperties {
  children: ReactNode;
}

export default function AuthProvider(props: AuthProviderProperties): React.JSX.Element {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [session, setSession] = useState<string | null>(null);
  const { setCookie, clearAllCookies } = useCookies();
  const navigate = useNavigate();

  /**
   * Login to retrieve new cookie.
   * @param {string} emailAddress
   * @param {string} password
   */
  async function login(emailAddress: string, password: string): Promise<boolean> {
    const { ok, userName, id, email, session: sessionToken } = await sendLoginRequest(emailAddress, password);
    if (ok && userName && id && email && sessionToken) {
      setUser({ userName, id, email });
      setSession(sessionToken);
      setCookie("session", sessionToken, 1);
      navigate("/chat");
      return ok;
    }
    navigate("/");
    return ok;
  }

  /**
   * Validate existing cookie.
   */
  async function validateSession(): Promise<void> {
    if (session) {
      // Already validated.
      return;
    }
    const { ok, userName, id, email, session: sessionToken } = await sendValidateRequest();
    if (ok && userName && id && email && sessionToken) {
      setUser({ userName, id, email });
      setSession(sessionToken);
      return;
    }
    navigate("/");
  }

  /**
   * Logout to clear cookies and "reset" state.
   */
  async function logout(): Promise<void> {
    await sendLogoutRequest();
    setUser(null);
    setSession(null);
    clearAllCookies();
    navigate("/");
  }

  // prettier-ignore
  return (
    <AuthContext.Provider value={{ validateSession, session, user, login, logout }}>
      {props.children}
    </AuthContext.Provider>
  )
}
