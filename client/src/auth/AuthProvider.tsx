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

  /**
   * Login to retrieve new cookie.
   * @param {string} emailAddress
   * @param {string} password
   */
  async function login(emailAddress: string, password: string): Promise<void> {
    const { ok, name, id, email, session: sessionToken } = await sendLoginRequest(emailAddress, password);
    if (ok && name && id && email && sessionToken) {
      setUser({ name, id, email });
      setSession(sessionToken);
      setCookie("session", sessionToken, 1);
      navigate("/chat");
      return;
    }
    navigate("/");
  }

  /**
   * Validate existing cookie.
   */
  async function validateSession(): Promise<void> {
    if (session) {
      // Already validated.
      return;
    }
    const { ok, name, id, email, session: sessionToken } = await sendValidateRequest();
    if (ok && name && id && email && sessionToken) {
      setUser({ name, id, email });
      setSession(sessionToken);
      return;
    }
    navigate("/");
  }

  /**
   * Logout to clear cookies and "reset" state.
   */
  function logout(): void {
    setUser(null);
    setSession(null);
    deleteAllCookies();
    navigate("/");
  }

  return <AuthContext.Provider value={{ validateSession, session, user, login, logout }}>{props.children}</AuthContext.Provider>;
}

/**
 * Delete all cookies in browser (covers some edge cases for malformed cookies).
 */
function deleteAllCookies(): void {
  const FORCE_COOKIE_EXPIRATION_PAYLOAD = "; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT";

  document.cookie.split(";").forEach((cookie) => {
    const [name, value] = cookie.split("=");
    if (value === undefined) {
      //
      // As odd as it sounds, if value === undefined it means we were sent a malformed cookie where the name is actually undefined, not the value.
      //
      // Example:
      //  The cookie below actually has no name, but we see it as having one... (created by doing `document.cookie = "fake"` in FireFox console):
      //    console.log(malformedCookie); // -> { name: ' fake', value: undefined }
      //
      // The cookie below legit doesn't have a value. I created a random cookie and removed the value:
      //    console.log(cookieWithoutValue); // -> { name: ' {36b29ec7-423c-4c9a-b644-3b4ddcd7409c}', value: '' }
      //
      // ********* NOTICE *********************************************************************************************************************
      // how the malformed cookie has a value of `undefined` but the cookie without a value has a value of `''`?
      // **************************************************************************************************************************************
      //
      document.cookie = `=${name.trim()}${FORCE_COOKIE_EXPIRATION_PAYLOAD}`;
      return;
    }
    document.cookie = `${name.trim()}=${value.trim()}${FORCE_COOKIE_EXPIRATION_PAYLOAD}`;
  });
}
