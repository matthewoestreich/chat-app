import { Request, Response, NextFunction } from "express";
import jsonwebtoken from "jsonwebtoken";
import { generateSessionToken } from "@/server/generateTokens.js";

const ONE_DAY = 24 * 60 * 60 * 1000;

//export default function useJwtSession({ onError = (_req: Request, _res: Response, _next: NextFunction): void => {} } = {}) {}

export default async function useJwt(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { session } = req.cookies;
    if (!session) {
      return next();
    }

    const decodedToken = (await verifyJwtAsync(session, process.env.JWT_SIGNATURE || "")) as Account | null;
    if (decodedToken) {
      req.user = { name: decodedToken.name, email: decodedToken.email, id: decodedToken.id };
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
    const decodedToken = jsonwebtoken.decode(receivedSessionToken) as JSONWebToken;
    if (!decodedToken.id) {
      return false;
    }

    // Get existing session token from db.
    const existingSession = await req.databaseProvider.sessions.selectByUserId(decodedToken.id);
    // If no existing token, or existing token missing "token" column, or mismatch force user to reauth.
    if (!existingSession || !existingSession.token || String(existingSession.token) !== receivedSessionToken) {
      return false;
    }

    // Now we have the "OK" to generate a new token..
    const sessionToken = generateSessionToken(decodedToken.name, decodedToken.id, decodedToken.email);
    // Update refresh token in db to newly generated refresh token.
    await req.databaseProvider.sessions.upsert(decodedToken.id, sessionToken.signed);
    // Update request object
    req.user = { name: decodedToken.name, id: decodedToken.id, email: decodedToken.email };
    // Update client side cookie
    console.log({ from: "useJwt", action: "Setting session cookie", cookie: sessionToken.signed });
    res.cookie("session", sessionToken.signed, { maxAge: ONE_DAY });
    return true;
  } catch (_e) {
    return false;
  }
}
