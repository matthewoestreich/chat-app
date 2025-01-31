import React, { ReactNode, useState } from "react";
import AuthContext from "./AuthContext";
import { useNavigate } from "react-router-dom";
import { sendLoginRequest, sendValidateRequest } from "./authService";
import { useCookies } from "@hooks";

interface AuthProviderProperties {
  children: ReactNode;
}

export default function AuthProvider(props: AuthProviderProperties): React.JSX.Element {
  const [user, setUser] = useState<UserData | null>(null);
  const [session, setSession] = useState<string | null>(null);
  const { setCookie } = useCookies();
  const navigate = useNavigate();

  async function login(emailAddress: string, password: string): Promise<void> {
    const { ok, name, id, email, session: sessionToken } = await sendLoginRequest(emailAddress, password);
    if (ok && name && id && email && sessionToken) {
      setUser({ name, id, email });
      setSession(sessionToken);
      setCookie("session", sessionToken, 1);
      navigate("/chat");
      return;
    }
    console.error({ loginResult: { ok, name, id, email, session: sessionToken } });
    navigate("/");
  }

  async function validateSession(): Promise<void> {
    if (session) {
      console.log({ from: "[AuthProvider]::validateSession", message: "Session (from context) is now set, returning and continuing to outlet." });
      return;
    }
    const { ok, name, id, email, session: sessionToken } = await sendValidateRequest();
    if (ok && name && id && email && sessionToken) {
      console.log({
        from: "[AuthProvider]::validateSession",
        message: "Found existing session! Setting user and session then continuing to outlet.",
      });
      setUser({ name, id, email });
      setSession(sessionToken);
      return;
    }
    console.log({
      from: "[AuthProvider]::validateSession",
      message: "No valid existing session found, redirecting to '/'",
      documentCookie: document.cookie,
      session,
    });
    navigate("/");
  }

  function logout(): void {
    setUser(null);
    setSession(null);
    document.cookie = "";
    navigate("/");
  }

  return <AuthContext.Provider value={{ validateSession, session, user, login, logout }}>{props.children}</AuthContext.Provider>;
}
