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
export default function ({ onError = (req, res, next) => {} } = {}) {
  return async function (req, res, next) {
    try {
      const { access_token, refresh_token } = req.cookies;
      if (!access_token || !refresh_token) {
        return onError(req, res, next);
      }

      const decodedAccessToken = await verifyJwtAsync(access_token, process.env.JWT_SIGNATURE);
      if (decodedAccessToken) {
        return next();
      }

      const decodedRefreshToken = await verifyJwtAsync(refresh_token, process.env.JWT_SIGNATURE);
      if (decodedRefreshToken) {
        return next();
      }

      if (await handleRefresh(refresh_token, req, res)) {
        return next();
      }
      return onError(req, res, next);
    } catch (e) {
      console.log(e);
      return onError(req, res, next);
    }
  };
}

async function verifyJwtAsync(token, secret) {
  return new Promise((resolve, reject) => {
    jsonwebtoken.verify(token, secret, (err, decoded) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          return resolve(null);
        }
        return reject(err);
      } else {
        return resolve(decoded);
      }
    });
  });
}

async function handleRefresh(refresh_token, req, res) {
  try {
    // If we made it here it means refresh_token is expired, and `jsonwebtoken.verify` has returned an undefined token.
    // That is why we need to decode the token manually as to get user specific info from it, so we can use it to query
    // our db.
    const decodedRefreshToken = jsonwebtoken.decode(refresh_token);
    if (!decodedRefreshToken?.id) {
      console.log(`[useJwt][ERROR] no id found in decoded refresh_token`);
      return false;
    }

    console.log(`[useJwt][INFO][id:${decodedRefreshToken?.id}] access_token is expired. refresh_token has id. Checking if received refresh_token is the same as refreshToken we have in database.`);

    // Get existing refresh token from db.
    const dbHandleRefresh = await req.dbPool.getConnection();
    const existingRefresh = await refreshTokenService.selectByUserId(dbHandleRefresh, decodedRefreshToken?.id);

    // If no existing token, or existing token missing "token" column, or mismatch between token from db and token we
    // received (req.cookies.refresh_token), force user to log-in again.
    if (!existingRefresh || !existingRefresh?.token || existingRefresh.token !== refresh_token) {
      console.log(`[useJwt][ERROR] either no existing refreshToken is stored in our DB or there is a token mismatch!`, { existing: existingRefresh?.token, received: refresh_token });
      req.dbPool.releaseConnection(dbHandleRefresh);
      return false;
    }

    console.log(`[useJwt][INFO][id:${decodedRefreshToken?.id}] it is the same, generating new token pair`);

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

    return true;
  } catch (e) {
    return false;
  }
}
