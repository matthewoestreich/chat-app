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
          // update request object
          req.access_token = accessToken;
          req.refresh_token = refreshToken;
          // Update client side cookie
          res.cookie("access_token", accessToken, { maxAge: ONE_DAY });
          res.cookie("refresh_token", refreshToken, { maxAge: ONE_DAY });
          req.dbPool.releaseConnection(db);
          console.log(`[useJWT][SUCCESS] Generated new access and refresh tokens`);
          return next();
        }

        if (!refreshTokenErr) {
          log("[INFO] no errors, need to verify refresh token exists in db first before refreshing access token.");
          const dbHandleRefresh = await req.dbPool.getConnection();
          const exists = await doesRefreshTokenExistInDatabaseAndMatch(dbHandleRefresh, decodedRefreshToken?.id, refresh_token);
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

/*
export default function (req, res, next) {
  const { access_token, refresh_token } = req.cookies;

  return jsonwebtoken.verify(access_token, process.env.JWT_SIGNATURE, (accessTokenErr, decodedAccessToken) => {
    console.log(`[useJWT] initial verify step.`, { decodedAccessToken })
    if (accessTokenErr) {
      //if (!decodedAccessToken?.id) { // No id in token..
      //  console.log(`[useJWT] No id found on access token.`, {access_token, cookies:req.cookies});
      //  return res.redirect("/v2");
      //}
      if (accessTokenErr.name !== "TokenExpiredError") {
        console.log(`[useJWT] Received error.`, {accessTokenErr});
        return res.redirect("/v2"); // next(err);
      }

      // We got an expired access token...
      console.log(`[useJWT][ACCESS TOKEN EXPIRED] need to call 'decode' to get userId from it.`);

      if (!refresh_token) {
        console.log(` - [useJWT] Unable to locate refresh token, user must reauth!`);
        return res.redirect("/v2");
      }

      // Verify refresh token is valid
      jsonwebtoken.verify(refresh_token, process.env.JWT_SIGNATURE, async (refreshTokenErr, decodedRefreshToken) => {
        console.log(` - [useJWT] Checking refresh token.`);

        if (refreshTokenErr) {
          if (refreshTokenErr.name !== "TokenExpiredError") {
            console.log(` - [useJWT] Issue with refresh token.`, {refreshTokenErr});
            // Most likely the refresh token itself has expired, which means they'll need to reauth..
            return res.redirect("/v2");
          }

          // If we made it this far we know the token is expired
          console.log(` - [useJWT] Refresh token expired, need to check if it's valid, if so, generate new pair.`);
          // Since "verify" returns undefined when a token is not valid, we have to manually decode it so we can
          // pull the userId out of it in order to query our database.
          decodedRefreshToken = jsonwebtoken.decode(refresh_token);
          console.log(` - [useJWT] decoded invalid refresh token..`, {decodedRefreshToken});

          const dbHandleRefreshToken = await req.dbPool.getConnection();
          const existingRefresh = await refreshTokenQueries.selectByUserId(dbHandleRefreshToken, decodedRefreshToken.id);
          req.dbPool.releaseConnection(dbHandleRefreshToken);
          console.log(` - [useJWT] got existing token from db`, {existingRefresh});

          if (!existingRefresh || !existingRefresh?.token) {
            console.log(` - [useJWT] No existing refresh token found. Session could have been revoked or logged out.`);
            // If no refresh token exists in the db it means the session was revoked or logged out, etc..
            return res.redirect("/v2");
          }

          // Verify refresh token is the one we have in our DB. This helps to prevent replaying old tokens..
          // Someone trying to replay an old token since if we made it this far, it has to be a valid token.
          // So force the user to reauth.
          if (existingRefresh.token !== refresh_token) {
            console.log(` - [useJWT] Refresh token from req.cookies does not match what we have stored in database. Possible replay or stale refresh token being used.`, {existingRefreshToken:existingRefresh?.token, refresh_token});
            return res.redirect("/v2");
          }

          // Refresh token is most recent (aka valid), generate new tokens and store in DB.
          console.log(` - [useJWT] Refresh token is most recent and is valid. We have the ok to refresh to pair.`);
          const dbHandleGenNewTokens = await req.dbPool.getConnection();
          const newTokens = await generateTokensAndUpdateOrInsert(dbHandleGenNewTokens, decodedRefreshToken?.id);
          req.dbPool.releaseConnection(dbHandleGenNewTokens);

          req.access_token = newTokens.accessToken;
          req.refresh_token = newTokens.refreshToken;
          // Update client side cookie
          res.setHeader("Set-Cookie", createCookie("access_token", newTokens.accessToken, 1));
          res.setHeader("Set-Cookie", createCookie("refresh_token", newTokens.refreshToken, 1));
          console.log(` - [useJWT][SUCCESS] Generated new access and refresh tokens`);
          return next();
        }

        if (!refreshTokenErr) {
          // Refresh token is valid, just generate new access token.
          console.log(` - [useJWT] Refresh token is not expired and there was no error. Need to veryif existence of refresh token in db before generating new access token.`);
          const newAccessToken = generateAccessToken(decodedRefreshToken.id);
          req.access_token = newAccessToken;
          // Update client side cookie
          res.setHeader("Set-Cookie", createCookie("access_token", newAccessToken, 1));
          console.log(` - [useJWT][SUCCESS] Generated new access token only`);
          return next();
        }
      });
    } 

    // If null check is not here this will still get fired even if there was an error above...
    // ...(in which all paths lead to a return..) so it's a little odd.
    if (!accessTokenErr) {
      // If no error on access token
      console.log(` - [useJWT][SUCCESS] Access token is fine!`);
      return next();
    }
  });
}
*/
