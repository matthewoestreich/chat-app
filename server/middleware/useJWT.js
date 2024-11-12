import jsonwebtoken from "jsonwebtoken";
import { refreshTokenQueries } from "#@/db/queries/index.js";
import generateTokens, { generateAccessToken } from "#@/server/generateTokens.js";

const ONE_DAY = 24 * 60 * 60 * 1000;

function log(msg, data) {
  if (!msg.startsWith("[")) msg = " " + msg;
  let toLog = `[useJWT]${msg}`;
  if (data) {
    console.log(toLog, data);
    return;
  }
  console.log(toLog);
}

export default function (req, res, next) {
  const { access_token, refresh_token } = req.cookies;
  if (!access_token || !refresh_token) {
    log("missing access token or refresh token");
    return res.redirect("/v2");
  }

  return jsonwebtoken.verify(access_token, process.env.JWT_SIGNATURE, (accessTokenErr, decodedAccessToken) => {
    if (accessTokenErr) {
      if (accessTokenErr.name !== "TokenExpiredError") {
        log("[WARN][ACCESS_TOKEN] received error other than token expired, redirecting to v2");
        return res.redirect("/v2");
      }

      // access token is expired...
      log("[WARN][ACCESS TOKEN EXPIRED] access token expired, verifying refresh token");

      jsonwebtoken.verify(refresh_token, process.env.JWT_SIGNATURE, async (refreshTokenErr, decodedRefreshToken) => {
        if (refreshTokenErr) {
          if (refreshTokenErr.name !== "TokenExpiredError") {
            log("[WARN][REFRESH TOKEN] received error other than token expired, redirecting to v2");
            return res.redirect("/v2");
          }

          log("[WARN][REFRESH TOKEN EXPIRED] need to call decode on received refresh_token to get userId from it.");
          decodedRefreshToken = jsonwebtoken.decode(refresh_token);

          const db = await req.dbPool.getConnection();
          const existing = await doesRefreshTokenExistInDatabaseAndMatch(db, decodedRefreshToken?.id, refresh_token);
          if (!existing) {
            req.dbPool.releaseConnection(db);
            return res.redirect("/v2");
          }

          log("[MATCH] token we received matches what we have stored. We have the OK to generate a new token pair!!");
          const { accessToken, refreshToken } = generateTokens(decodedRefreshToken?.id);
          // Update new refresh token in db.
          await refreshTokenQueries.update(db, decodedRefreshToken?.id, refreshToken);
          req.dbPool.releaseConnection(db);
          // update request object
          req.access_token = accessToken;
          req.refresh_token = refreshToken;
          // Update client side cookie
          res.cookie("access_token", accessToken, { maxAge: ONE_DAY });
          res.cookie("refresh_token", refreshToken, { maxAge: ONE_DAY });
          console.log(`[useJWT][SUCCESS] Generated new access and refresh tokens`);
          return next();
        }

        if (!refreshTokenErr) {
          log("[INFO] no errors, need to verify refresh token exists in db first before refreshing access token.");
          const db = await req.dbPool.getConnection();
          const exists = await doesRefreshTokenExistInDatabaseAndMatch(db, decodedRefreshToken?.id, refresh_token);
          req.dbPool.releaseConnection(db);
          if (!exists) {
            log("[ERROR] while refresh token is valid, it doesn't exist in db which means session was removed or logged out. User must reauth!");
            return res.redirect("/v2");
          }
          log("[SUCCESS] refresh token in db matches, can generate new access token now.");
          const newAccessToken = generateAccessToken(decodedRefreshToken.id);
          req.access_token = newAccessToken;
          res.cookie("access_token", newAccessToken, { maxAge: ONE_DAY });
          return next();
        }
      });
    }

    if (!accessTokenErr) {
      log("[SUCCESS] no error on access token");
      return next();
    }
  });
}

function doesRefreshTokenExistInDatabaseAndMatch(db, userId, receivedRefreshToken) {
  return new Promise(async (resolve) => {
    if (!userId) {
      resolve(false);
    }
    log("checking db to see if we have an existing refresh_token");
    const existingRefresh = await refreshTokenQueries.selectByUserId(db, userId);
    if (!existingRefresh) {
      log("[ERROR] no existing row in db! refresh token doesn't exists! Redirecting");
      return resolve(false);
    }
    if (!existingRefresh?.token) {
      log("[ERROR] found existing row in db, but no value for token! Redirecting");
      return resolve(false);
    }
    if (existingRefresh.token !== receivedRefreshToken) {
      log("[MISMATCH] existing token does not mach what we received. User must reauth!");
      return resolve(false);
    }
    return resolve(existingRefresh);
  });
}
