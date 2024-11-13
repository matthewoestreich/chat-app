import jsonwebtoken from "jsonwebtoken";
import { refreshTokenQueries } from "#@/db/queries/index.js";
import generateTokenPair, { generateAccessToken } from "#@/server/generateTokens.js";

const ONE_DAY = 24 * 60 * 60 * 1000;

/**
 * Middleware to verify token(s). Requires both access token and refresh token to be present.
 *
 * If access token is expired, we check the refresh token. If the refresh token is also expired,
 * we look up the users stored refresh token from our db. If they match, we generate a new token
 * pair. If a refresh token doesn't match or isn't present, etc.. we force the user to log-in again.
 *
 * We auto generate the token pair, even if refresh token is expired (but exists in our db) so
 * the user doesn't have to log-in again when we know the refresh token they sent us is the most
 * recent one we have, and therefore is valid.
 *
 * If the access token is expired but the refresh token isn't, we still verify the received refresh
 * token matches what we have in our database. Otherwise, it means the "session" was revoked, or
 * logged out, or even someone trying to replay an old refresh token.
 */
export default function (req, res, next) {
  const { access_token, refresh_token } = req.cookies;
  // Force user to log-in again if we are missing either token.
  if (!access_token || !refresh_token) {
    return res.redirect("/v2");
  }

  return jsonwebtoken.verify(access_token, process.env.JWT_SIGNATURE, (accessTokenErr, decodedAccessToken) => {
    // If we have a good access token, we can continue.
    if (!accessTokenErr) {
      return next();
    }
    // Received an error other than token expired for access token, so forc the user to log-in again.
    if (accessTokenErr.name !== "TokenExpiredError") {
      return res.redirect("/v2");
    }

    // If we made it here, we know the access token is expired.

    jsonwebtoken.verify(refresh_token, process.env.JWT_SIGNATURE, async (refreshTokenErr, decodedRefreshToken) => {
      if (refreshTokenErr) {
        // We have a JWT error but it isn't TokenExpired so force user to log in again.
        if (refreshTokenErr.name !== "TokenExpiredError") {
          return res.redirect("/v2");
        }

        // Since we received an invalid refresh token (as far as JWT rules are concerned), and `jsonwebtoken.verify`
        // will return an undefined token if it isn't valid, we have to manually decode the expired token as to
        // get the userId. This is needed so we can query our database, using said userId, for an existing refresh token.
        //
        // Essentially if the token we have stored in our database is the same token the user just sent us, it means
        // we have a valid session still. Instead of forcing them to log-in again, we automatically generate a new
        // token pair (access & refresh tokens).
        decodedRefreshToken = jsonwebtoken.decode(refresh_token);
        if (!decodedRefreshToken?.id) {
          return res.redirect("/v2");
        }

        // Get existing refresh token from db.
        const dbHandleRefresh = await req.dbPool.getConnection();
        const existingRefresh = await refreshTokenQueries.selectByUserId(dbHandleRefresh, decodedRefreshToken?.id);

        // If no existing token, or existing token missing "token" column, or mismatch between token from db and token we
        // received (req.cookies.refresh_token), force user to log-in again.
        if (!existingRefresh || !existingRefresh?.token || existingRefresh.token !== refresh_token) {
          req.dbPool.releaseConnection(dbHandleRefresh);
          return res.redirect("/v2");
        }

        // Now we have the "OK" to generate a new token pair..
        const { accessToken, refreshToken } = generateTokenPair(decodedRefreshToken?.id);

        // Update refresh token in db to newly generated refresh token.
        await refreshTokenQueries.update(dbHandleRefresh, decodedRefreshToken?.id, refreshToken);
        req.dbPool.releaseConnection(dbHandleRefresh);

        // update request object
        req.access_token = accessToken;
        req.refresh_token = refreshToken;

        // Update client side cookie
        res.cookie("access_token", accessToken, { maxAge: ONE_DAY });
        res.cookie("refresh_token", refreshToken, { maxAge: ONE_DAY });

        return next();
      }

      // If we made it here, we know the refresh token is valid.

      // Even though refresh token is valid, we still want to verify it exists in our db. Otherwise,
      // it means the "session" has been revoked, or someone is trying to replace an old refresh token, etc..
      const db = await req.dbPool.getConnection();
      const existingRefresh = await refreshTokenQueries.selectByUserId(db, userId);
      req.dbPool.releaseConnection(db);

      // If no existing token, or existing token missing "token" column, or mismatch between token from db and token we
      // received (req.cookies.refresh_token), force user to log-in again.
      if (!existingRefresh || !existingRefresh?.token || existingRefresh.token !== refresh_token) {
        return res.redirect("/v2");
      }

      // Stored refresh token matches what we received, we now have the "OK" to generate a new access token.
      const newAccessToken = generateAccessToken(decodedRefreshToken.id);
      req.access_token = newAccessToken;
      res.cookie("access_token", newAccessToken, { maxAge: ONE_DAY });

      return next();
    });
  });
}
