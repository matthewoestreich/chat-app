export default function (req, res, next) {
  req.cookies = {}; // Initialize an empty cookie object

  if (req.headers.cookie) {
    const cookies = req.headers.cookie.split(";");

    cookies.forEach((cookie) => {
      const [name, value] = cookie.trim().split("=");
      req.cookies[name] = value;
    });
  }

  next();
}
