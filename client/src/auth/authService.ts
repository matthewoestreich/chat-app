/**
 * Sends login request to backend.
 * @param email
 * @param password
 * @returns {Promise<LoginResult>}
 */
export async function sendLoginRequest(email: string, password: string): Promise<LoginResult> {
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
  console.log({ response, result });
  if (response.status !== 200 || !result.ok) {
    return { ok: false, session: "" };
  }
  return { ok: true, session: result.session };
}

/**
 * Send register request to backend.
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
  return { ok: true, id: result.id, name: result.name, email: result.email };
}

/**
 * If someone visits "/" for example.. and they have a valid session, this makes
 * sure they don't have to reauth.
 * The diff between this route and validate route is validate will handle refreshing.
 * @returns {Promise<AutoLoginCheckResult>}
 */
export async function sendAutoLoginCheckRequest(): Promise<AutoLoginCheckResult> {
  const URL_PATH = "/auth/auto-login";
  const response = await fetch(URL_PATH, { method: "POST" });
  const result = await response.json();
  if (response.status !== 200 && !result.redirectTo) {
    return { ok: false, redirectTo: "" };
  }
  return { ok: true, redirectTo: result.redirectTo };
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
