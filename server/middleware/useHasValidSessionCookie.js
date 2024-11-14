import jsonwebtoken from "jsonwebtoken";
import { refreshTokenService } from "#@/db/services/index.js";

/**
 * If request has a refresh token, we check if that matches what we have in our database.
 * If it does, they have a valid session.
 */
export default async function (req, res, next) {
  const { refresh_token } = req.cookies;

  if (!refresh_token) {
    return next();
  }

  const decodedToken = jsonwebtoken.decode(refresh_token);

  return req.dbPool
    .getConnection()
    .then((db) => {
      return refreshTokenService
        .selectByUserId(db, decodedToken?.id)
        .then((row) => {
          if (row.token !== refresh_token) {
            // If token mismatch, remove client side token so they have to reauth.
            res.clearCookie("access_token");
            res.clearCookie("refresh_token");
            return next();
          }
          return res.redirect("/v2/chat");
        })
        .catch((e) => next());
    })
    .catch((e) => next());
}
