import { Request, Response, NextFunction } from "express";
import jsonwebtoken from "jsonwebtoken";
import { generateSessionToken } from "@server/generateTokens.js";

const ONE_DAY = 24 * 60 * 60 * 1000;

function formatUser(user: AuthenticatedUser): { id: string; userName: string; email: string } {
  return { id: user.id, userName: user.userName, email: user.email };
}

export default async function useJwt(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { session } = req.cookies;
    if (!session) {
      return next();
    }

    const decodedToken = (await verifyJwtAsync(session, process.env.JWT_SIGNATURE || "")) as AuthenticatedUser | null;
    if (decodedToken) {
      req.user = formatUser(decodedToken);
      return next();
    }

    // Here session is expired. Check DB to see if it matches with current session, if it does, refresh it.
    await handleSessionRefresh(session, req, res);
    next();
  } catch (_e) {
    res.clearCookie("session");
    next();
  }
}

async function verifyJwtAsync(token: string, secret: string): Promise<string | jsonwebtoken.JwtPayload | undefined> {
  return new Promise((resolve, reject) => {
    jsonwebtoken.verify(token, secret, (err, decoded) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          return resolve(undefined);
        }
        return reject(err);
      } else {
        return resolve(decoded);
      }
    });
  });
}

async function handleSessionRefresh(receivedSessionToken: string, req: Request, res: Response): Promise<boolean> {
  try {
    const decodedToken = jsonwebtoken.decode(receivedSessionToken) as AuthenticatedUser | null;
    if (!decodedToken || !decodedToken.id) {
      return false;
    }

    // Get existing session token from db.
    const existingSession = await req.databaseProvider.sessions.selectByUserId(decodedToken.id);
    // If no existing token, or existing token missing "token" column, or mismatch force user to reauth.
    if (!existingSession || !existingSession.token || String(existingSession.token) !== receivedSessionToken) {
      return false;
    }

    // Now we have the "OK" to generate a new token..
    const sessionToken = generateSessionToken(decodedToken.userName, decodedToken.id, decodedToken.email);
    // Update refresh token in db to newly generated refresh token.
    await req.databaseProvider.sessions.upsert(decodedToken.id, sessionToken.signed);
    // Update request object
    req.user = formatUser(decodedToken);
    // Update client side cookie
    res.cookie("session", sessionToken.signed, { maxAge: ONE_DAY });
    return true;
  } catch (_e) {
    return false;
  }
}
