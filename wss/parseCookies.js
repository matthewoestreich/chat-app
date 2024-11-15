export default function (rawCookie) {
  const cookies = {}; // Initialize an empty cookie object

  if (rawCookie) {
    rawCookie.split(";").forEach((cookie) => {
      const [name, value] = cookie.trim().split("=");
      cookies[name] = value;
    });
  }

  return cookies;
}
