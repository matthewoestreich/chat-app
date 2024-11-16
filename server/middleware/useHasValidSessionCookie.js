import jsonwebtoken from "jsonwebtoken";
import { refreshTokenService, sessionService } from "@/db/services/index.js";

/**
 * If request has a refresh token, we check if that matches what we have in our database.
 * If it does, they have a valid session.
 */
export default async function (req, res, next) {
  const { session } = req.cookies;

  if (!session) {
    return next();
  }

  const decodedToken = jsonwebtoken.decode(session);

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
