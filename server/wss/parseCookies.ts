export default function (rawCookie: string): WsCookies {
  const cookies: WsCookies = { session: "" }; // Initialize an empty cookie object

  if (rawCookie) {
    rawCookie.split(";").forEach((cookie) => {
      const [name, value] = cookie.trim().split("=");
      cookies[name] = value;
    });
  }

  return cookies;
}
