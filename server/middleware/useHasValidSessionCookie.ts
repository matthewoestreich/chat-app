import { Request, Response, NextFunction } from "express";
import jsonwebtoken from "jsonwebtoken";

/**
 * If request has a session cookie, we check if that matches what we have in our database.
 * If it does, they have a valid session.
 */
export default async function (req: Request, res: Response, next: NextFunction) {
  try {
    const { session } = req.cookies;

    if (!session) {
      return next();
    }

    const decodedToken = jsonwebtoken.decode(session) as JSONWebToken;
    const storedSession = await req.databaseProvider.sessions.selectByUserId(decodedToken?.id); //sessionService.selectByUserId(db, decodedToken?.id);

    if (!storedSession || (storedSession.token && storedSession.token !== session)) {
      res.clearCookie("session");
      req.cookies.session = "";
      return next();
    }

    return res.redirect("/chat");
  } catch (e) {
    console.log(`[useHasValidSessionCookie][ERROR] `, e);
    return next();
  }
}
