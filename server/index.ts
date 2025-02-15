import path from "path";
import { Server, IncomingMessage, ServerResponse } from "http";
import express, { Request, Response } from "express";
import helmet, { HelmetOptions } from "helmet";
import bcrypt from "bcrypt";
import { generateSessionToken } from "@server/generateTokens.js";
import morgan from "morgan";
import { useCookieParser, useCspNonce, attachDatabaseProvider, useJwt, useErrorCatchall } from "@server/middleware";
import clearAllCookies from "./clearAllCookies";
import WebSocketApp from "./wss/WebSocketApp";
import setSessionCookie, { COOKIE_NAME } from "./sessionCookie";

const app = express();
export const setDatabaseProvider = attachDatabaseProvider(app);
export default app;

const helmetConfig: HelmetOptions = {
  // @ts-ignore
  contentSecurityPolicy: { directives: { scriptSrc: ["'self'", (_, res: Response): string => `'nonce-${res.locals.cspNonce}'`] } },
};

app.use(express.static(path.resolve(__dirname, "../www")));
app.use(express.json());
app.use(useCookieParser);
app.use(useCspNonce);
app.use(helmet(helmetConfig));

if (process.env.NODE_ENV !== "test") {
  morgan.token("body", (req: Request) => JSON.stringify(req.body || {}, null, 2));
  const morganSchema = ":date[clf] :method :url :status :response-time ms - :res[content-length] :body";
  const morganSkip = (req: Request): boolean => req.url === "./favicon.ico" || (req.url || "").startsWith("/public");
  app.use(morgan(morganSchema, { skip: morganSkip }));
}

// TODO : remove this
app.get("/wsapp-cache", (_req: Request, res: Response) => {
  // eslint-disable-next-line
  const cache: { [K: string]: any } = {};
  for (const [containerId, container] of WebSocketApp.appCache) {
    cache[containerId] = {};
    for (const [clientId, client] of container) {
      cache[containerId][clientId] = client.user;
    }
  }
  res.status(200).json(cache);
});

/**
 * @route {POST} /auth/validate
 *
 * Validates JWT and handles refresh.
 */
app.post("/auth/validate", [useJwt], (req: Request, res: Response) => {
  if (!req.cookies.session || !req.user) {
    // If nothing valid was found, clear all cookies.
    clearAllCookies(req, res);
    res.status(200).send({ ok: false });
    return;
  }
  const { userName, id, email } = req.user;
  res.status(200).send({ ok: true, userName, id, email, session: req.cookies.session });
});

/**
 * @route {POST} /auth/register
 *
 * Content-Type: application/json
 * {
 *    u: string, // username
 *    p: string, // password
 *    e: email,  // email
 * }
 */
app.post("/auth/register", async (req: Request, res: Response) => {
  try {
    const { u: username, p: password, e: email } = req.body;
    if (!username) {
      res.status(403).send({ ok: false });
      return;
    }
    const result = await req.databaseProvider.accounts.create(username, password, email);
    await req.databaseProvider.rooms.addUserToRoom(result.id, WebSocketApp.ID_UNASSIGNED);
    res.status(200).send({ ok: true, id: result.id, userName: result.userName, email: result.email });
  } catch (_e) {
    res.status(200).send({ ok: false });
  }
});

/**
 * @route {POST} /auth/login
 *
 * Content-Type: application/json
 * {
 *    e: string, // email
 *    p: string, // password
 * }
 */
app.post("/auth/login", async (req: Request, res: Response) => {
  try {
    clearAllCookies(req, res);

    const { p: password, e: email } = req.body;
    if (!password || !email) {
      res.status(403).send({ ok: false });
      return;
    }

    const foundUser = await req.databaseProvider.accounts.selectByEmail(email);
    if (!foundUser || !foundUser?.email || !foundUser?.password) {
      res.status(403).send({ ok: false });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, foundUser.password);
    if (!isValidPassword) {
      res.status(403).send({ ok: false });
      return;
    }

    const { userName, id, email: foundEmail } = foundUser;
    const jwt = generateSessionToken(userName, id, foundEmail);
    await req.databaseProvider.sessions.upsert(foundUser.id, jwt.signed);
    setSessionCookie(res, jwt);

    res.status(200).send({ ok: true, session: jwt.signed, id, userName, email });
  } catch (_e) {
    clearAllCookies(req, res);
    res.status(500).send({ ok: false });
  }
});

/**
 * Logs account out if they have req.cookies.session
 *
 * @route {POST} /logout
 */
app.post("/auth/logout", async (req: Request, res: Response) => {
  try {
    const { session } = req.cookies;
    await req.databaseProvider.sessions.delete(session);
    res.clearCookie(COOKIE_NAME);
    res.status(200).send({ ok: true });
  } catch (e) {
    console.error("Error during logout", e);
    res.clearCookie(COOKIE_NAME);
    res.status(500).send({ ok: false });
  }
});

/**
 * Serve React to everything else
 *
 * @route {GET} *
 */
app.get("*", (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "../www/index.html"));
});

/**
 * Catch-all error handler
 */
app.use(useErrorCatchall);

app.listenAsync = function (...args: any[]): Promise<Server<typeof IncomingMessage, typeof ServerResponse>> {
  return new Promise((resolve, reject) => {
    try {
      const server = app.listen(...args, () => {
        resolve(server);
      });
    } catch (e) {
      reject(e);
    }
  });
};
