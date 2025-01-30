import { Request, Response, NextFunction } from "express";
import jsonwebtoken from "jsonwebtoken";

/**
 * If request has a session cookie, we check if that matches what we have in our database.
 * If it does, they have a valid session.
 */
export default async function (req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { session } = req.cookies;
    if (!session) {
      next();
      return;
    }

    const decodedToken = jsonwebtoken.decode(session) as JSONWebToken;
    const storedSession = await req.databaseProvider.sessions.selectByUserId(decodedToken.id);

    if (!storedSession || storedSession.token !== session) {
      res.clearCookie("session");
      req.cookies.session = "";
    }

    next();
  } catch (e) {
    console.log(`[useHasValidSessionCookie][ERROR] `, e);
    return next();
  }
}
