import { AuthenticationResult, CreateAccountResult, LogoutResult } from "@client/types";

/**
 * Sends login request to backend.
 *
 * @param email
 * @param password
 * @returns {Promise<AuthenticationResult>}
 */
export async function sendLoginRequest(email: string, password: string): Promise<AuthenticationResult> {
  const URL_PATH = "/auth/login";
  const response = await fetch(URL_PATH, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      e: email,
      p: password,
    }),
  });
  const result = await response.json();
  if (response.status !== 200 || !result.ok) {
    return { ok: false };
  }
  return { ok: true, session: result.session, userName: result.userName, id: result.id, email: result.email };
}

/**
 * Send register request to backend.
 *
 * @param name
 * @param password
 * @param email
 * @returns {Promise<CreateAccountResult>}
 */
export async function sendRegisterRequest(name: string, password: string, email: string): Promise<CreateAccountResult> {
  const URL_PATH = "/auth/register";
  const response = await fetch(URL_PATH, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      u: name,
      p: password,
      e: email,
    }),
  });
  const result = await response.json();
  if (response.status !== 200 || !result.ok) {
    return { ok: false };
  }
  return { ok: true, id: result.id, userName: result.userName, email: result.email };
}

/**
 * Send a request to validate a cookie.
 *
 * @returns {Promise<AuthenticationResult>}
 */
export async function sendValidateRequest(): Promise<AuthenticationResult> {
  const URL_PATH = "/auth/validate";
  const response = await fetch(URL_PATH, { method: "POST" });
  const result = await response.json();
  if (response.status === 200 && result.ok) {
    return { ok: true, session: result.session, userName: result.userName, id: result.id, email: result.email };
  }
  return { ok: false };
}

/**
 * Sends a logout request to the backend.
 *
 * @returns {Promise<LogoutResult>}
 */
export async function sendLogoutRequest(): Promise<LogoutResult> {
  const URL_PATH = "/auth/logout";
  const response = await fetch(URL_PATH, { method: "POST" });
  const result = await response.json();
  return { status: response.status, ok: result.ok };
}
