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
    const connection = await req.databasePool.getConnection();
    const storedSession = await sessionService.selectByUserId(connection.db, decodedToken?.id);

    if (storedSession.token !== session) {
      res.clearCookie("session");
      req.cookies.session = "";
      return next();
    }

    return res.redirect("/v2/chat");
  } catch (e) {
    console.log(`[useHasValidSessionCookie][ERROR] `, e);
    return next();
  }
}
