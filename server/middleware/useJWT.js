import jsonwebtoken from "jsonwebtoken";
import { refreshTokenService } from "#@/db/services/index.js";
import generateTokenPair from "#@/server/generateTokens.js";

const ONE_DAY = 24 * 60 * 60 * 1000;

/**
 * The SSR way we handle tokens.
 *
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
export default function useJwt({ onError = (req, res, next) => {} } = {}) {
  return function (req, res, next) {
    const { access_token, refresh_token } = req.cookies;
    // Force user to log-in again if we are missing either token.
    if (!access_token || !refresh_token) {
      return onError(req, res, next);
    }

    return jsonwebtoken.verify(access_token, process.env.JWT_SIGNATURE, (accessTokenErr, decodedAccessToken) => {
      // If we have a good access token, we can continue.
      if (!accessTokenErr) {
        return next();
      }
      // Received an error other than token expired for access token, so forc the user to log-in again.
      if (accessTokenErr.name !== "TokenExpiredError") {
        return onError(req, res, next);
      }

      // If we made it here, we know the access token is expired.

      jsonwebtoken.verify(refresh_token, process.env.JWT_SIGNATURE, async (refreshTokenErr, decodedRefreshToken) => {
        if (refreshTokenErr && refreshTokenErr.name !== "TokenExpiredError") {
          // We have a JWT error but it isn't TokenExpired so force user to log in again.
          return onError(req, res, next);
        }
        /**
         * THIS IS JUST FOR TESTING PURPOSES AND SHOULD BE REMOVED
         */
        if (refreshTokenErr && refreshTokenErr.name === "TokenExpiredError") {
          console.log(`[useJwt][INFO] refresh_token EXPIRED`);
        }

        // If we made it here, we know we have an expired access token, as well as either:
        //  1. TokenExpiredError on refresh token
        //  2. A valid refresh token.
        // In either scenario, a new access token needs to be created (after verifying the provided refresh token
        // matches the one we have stored in our database).
        // Every time an access token is generated, a fresh refreh token should also be generated with it.
        //
        // Since we received an invalid refresh token (as far as JWT rules are concerned), and jsonwebtoken.verify
        // will return an undefined token if it isn't valid, we have to manually decode the expired token as to
        // get the userId. This is needed so we can query our database, using said userId, for an existing refresh token.
        //
        // Essentially if the token we have stored in our database is the same token the user just sent us, it means
        // we have a valid session still. Instead of forcing them to log-in again, we automatically generate a new
        // token pair (access & refresh tokens).
        decodedRefreshToken = jsonwebtoken.decode(refresh_token);
        if (!decodedRefreshToken?.id) {
          console.log(`[useJwt][ERROR] no id found in decoded refresh_token`);
          return onError(req, res, next);
        }

        console.log(`[useJwt][INFO] access_token is expired. refresh_token has id. Checking if received refresh_token is the same as refreshToken we have in database.`);

        // Get existing refresh token from db.
        const dbHandleRefresh = await req.dbPool.getConnection();
        const existingRefresh = await refreshTokenService.selectByUserId(dbHandleRefresh, decodedRefreshToken?.id);

        // If no existing token, or existing token missing "token" column, or mismatch between token from db and token we
        // received (req.cookies.refresh_token), force user to log-in again.
        if (!existingRefresh || !existingRefresh?.token || existingRefresh.token !== refresh_token) {
          console.log(`[useJwt][ERROR] either no existing refreshToken is stored in our DB or there is a token mismatch!`, { existing: existingRefresh?.token, received: refresh_token });
          req.dbPool.releaseConnection(dbHandleRefresh);
          return onError(req, res, next);
        }

        console.log(`[useJwt][INFO] it is the same, generating new token pair`);

        // Now we have the "OK" to generate a new token pair..
        const { accessToken, refreshToken } = generateTokenPair(decodedRefreshToken?.name, decodedRefreshToken?.id, decodedRefreshToken.email);

        // Update refresh token in db to newly generated refresh token.
        await refreshTokenService.update(dbHandleRefresh, decodedRefreshToken?.id, refreshToken);
        req.dbPool.releaseConnection(dbHandleRefresh);

        // update request object
        req.access_token = accessToken;
        req.refresh_token = refreshToken;

        // Update client side cookie
        res.cookie("access_token", accessToken, { maxAge: ONE_DAY });
        res.cookie("refresh_token", refreshToken, { maxAge: ONE_DAY });

        return next();
      });
    });
  };
}
