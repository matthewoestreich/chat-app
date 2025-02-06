import { Cookies } from "../../types.shared";

export default function (rawCookie: string): Cookies {
  const cookies: Cookies = { session: "" }; // Initialize an empty cookie object

  if (rawCookie) {
    rawCookie.split(";").forEach((cookie) => {
      const [name, value] = cookie.trim().split("=");
      cookies[name] = value;
    });
  }

  return cookies;
}
