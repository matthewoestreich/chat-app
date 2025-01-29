/**
 * Sends login request to API.
 * @param email
 * @param password
 * @returns
 */
export default async function sendLoginRequest(email: string, password: string): Promise<LoginResult> {
  const response = await fetch("/auth/login", {
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
