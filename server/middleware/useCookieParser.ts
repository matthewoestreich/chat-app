import Express from "express";

export default function useCookieParser(req: Express.Request, _res: Express.Response, next: Express.NextFunction) {
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
