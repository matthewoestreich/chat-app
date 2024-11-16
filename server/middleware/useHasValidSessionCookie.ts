import { Request, Response, NextFunction } from "express";
import jsonwebtoken from "jsonwebtoken";
import { sessionService } from "@/db/services/index.js";

/**
 * If request has a refresh token, we check if that matches what we have in our database.
 * If it does, they have a valid session.
 */
export default async function (req: Request, res: Response, next: NextFunction) {
  const { session } = req.cookies;

  if (!session) {
    return next();
  }

  const decodedToken = jsonwebtoken.decode(session) as SessionToken;

  return req.databasePool
    .getConnection()
    .then((db) => {
      return sessionService
        .selectByUserId(db, decodedToken?.id)
        .then((row) => {
          if (row.token !== session) {
            // If token mismatch, remove client side token so they have to reauth.
            res.clearCookie("session");
            return next();
          }
          return res.redirect("/v2/chat");
        })
        .catch((e) => next());
    })
    .catch((e) => next());
}
