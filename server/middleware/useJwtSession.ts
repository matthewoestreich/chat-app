import { Request, Response, NextFunction } from "express";
import jsonwebtoken from "jsonwebtoken";
import { sessionService } from "@/db/services/index.js";
import { generateSessionToken } from "@/server/generateTokens.js";

const ONE_DAY = 24 * 60 * 60 * 1000;

export default function useJwtSession({ onError = (_req: Request, _res: Response, _next: NextFunction) => {} } = {}) {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      const { session } = req.cookies;
      if (!session) {
        return onError(req, res, next);
      }

      const decodedToken = await verifyJwtAsync(session, process.env.JWT_SIGNATURE || "");
      if (decodedToken) {
        return next();
      }

      // Here session is expired. Check DB to see if it matches with current session, if it does, refresh it.
      if (await handleSessionRefresh(session, req, res)) {
        return next();
      }
      return onError(req, res, next);
    } catch (e) {
      return onError(req, res, next);
    }
  };
}

async function verifyJwtAsync(token: string, secret: string) {
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

async function handleSessionRefresh(receivedSessionToken: string, req: Request, res: Response) {
  try {
    const decodedToken = jsonwebtoken.decode(receivedSessionToken) as SessionToken;
    if (!decodedToken.id) {
      console.log(`[useJwt][ERROR] no id found in decoded session token`);
      return false;
    }

    console.log(`[useJwt][INFO][id:${decodedToken?.id}] session token is expired. session token has id. Checking if received session token is the same as sessionToken we have in database.`);

    // Get existing session token from db.
    const db = await req.databasePool.getConnection();
    const existingSession = await sessionService.selectByUserId(db, decodedToken.id);

    // If no existing token, or existing token missing "token" column, or mismatch force user to reauth.
    if (!existingSession || !existingSession.token || existingSession.token !== receivedSessionToken) {
      console.log(`[useJwt][ERROR] either no existing session token is stored in our DB or there is a token mismatch!`, { existing: existingSession?.token, received: receivedSessionToken });
      req.databasePool.releaseConnection(db);
      return false;
    }

    console.log(`[useJwt][INFO][id:${decodedToken?.id}] it is the same, generating new token`);

    // Now we have the "OK" to generate a new token..
    const sessionToken = generateSessionToken(decodedToken.name, decodedToken.id, decodedToken.email);

    // Update refresh token in db to newly generated refresh token.
    await sessionService.update(db, decodedToken.id, sessionToken);
    req.databasePool.releaseConnection(db);

    // update request object
    req.sessionToken = sessionToken;
    // Update client side cookie
    res.cookie("session", sessionToken, { maxAge: ONE_DAY });

    return true;
  } catch (e) {
    return false;
  }
}

/*
function useJwt({ onError = (_req: Request, _res: Response, _next: NextFunction) => {} } = {}) {
  return async function (req: Request, res, next) {
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
*/
/*
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
    const dbHandleRefresh = await req.databasePool.getConnection();
    const existingRefresh = await refreshTokenService.selectByUserId(dbHandleRefresh, decodedRefreshToken?.id);

    // If no existing token, or existing token missing "token" column, or mismatch between token from db and token we
    // received (req.cookies.refresh_token), force user to log-in again.
    if (!existingRefresh || !existingRefresh?.token || existingRefresh.token !== refresh_token) {
      console.log(`[useJwt][ERROR] either no existing refreshToken is stored in our DB or there is a token mismatch!`, { existing: existingRefresh?.token, received: refresh_token });
      req.databasePool.releaseConnection(dbHandleRefresh);
      return false;
    }

    console.log(`[useJwt][INFO][id:${decodedRefreshToken?.id}] it is the same, generating new token pair`);

    // Now we have the "OK" to generate a new token pair..
    const { accessToken, refreshToken } = generateTokenPair(decodedRefreshToken?.name, decodedRefreshToken?.id, decodedRefreshToken.email);

    // Update refresh token in db to newly generated refresh token.
    await refreshTokenService.update(dbHandleRefresh, decodedRefreshToken?.id, refreshToken);
    req.databasePool.releaseConnection(dbHandleRefresh);

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
*/
