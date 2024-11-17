import { Request, Response, NextFunction } from "express";
import jsonwebtoken from "jsonwebtoken";
import { sessionService } from "@/server/db/services/index.js";

/**
 * If request has a refresh token, we check if that matches what we have in our database.
 * If it does, they have a valid session.
 */
export default async function (req: Request, res: Response, next: NextFunction) {
  try {
    const { session } = req.cookies;

    if (!session) {
      return next();
    }

    const decodedToken = jsonwebtoken.decode(session) as SessionToken;
    console.log(decodedToken);
    const { db, release } = await req.databasePool.getConnection();
    console.log({ dbPool: req.databasePool });
    const storedSession = await sessionService.selectByUserId(db, decodedToken?.id);
    release();

    console.log({ storedSession });

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
