import path from "path";
import { Server, IncomingMessage, ServerResponse } from "http";
import express, { Request, Response } from "express";
import helmet, { HelmetOptions } from "helmet";
import bcrypt from "bcrypt";
import { generateSessionToken } from "@/server/generateTokens.js";
import morgan from "morgan";
import { useCookieParser, useCspNonce, attachDatabaseProvider, useAutoLogin, useJwt, useErrorCatchall } from "@/server/middleware";

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

/**
 * @route {POST} /auth/validate
 *
 * Validates JWT and handles refresh.
 */
app.post("/auth/validate", [useJwt], (req: Request, res: Response) => {
  if (req.cookies.session) {
    // If no valid session exists, middleware would have removed cookie by now.
    res.status(200).send({ ok: true });
    return;
  }
  res.status(200).send({ ok: false });
});

/**
 * @route {POST} /auth/auto-login
 *
 * If someone visits "/" and they have a valid token, we don't force them to reauth.
 * The diff between this route and validate route is validate will handle refreshing.
 */
app.post("/auth/auto-login", [useAutoLogin], async (req: Request, res: Response) => {
  if (req.cookies.session) {
    // If no valid session exists, middleware would have removed cookie by now.
    res.status(200).send({ ok: true, redirectTo: "/chat" });
    return;
  }
  res.status(200).send({ ok: false, redirectTo: "" });
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
      console.log(`[POST /register] missing username (as 'p') in request body!`, { user: req.body });
      res.status(403).send({ ok: false });
      return;
    }
    const result = await req.databaseProvider.accounts.create(username, password, email);
    res.status(200).send({ ok: true, id: result.id, name: result.name, email: result.email });
  } catch (e) {
    console.log(`[POST /register][ERROR]`, { e });
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
    const { p: password, e: email } = req.body;
    if (!password || !email) {
      console.log(`[POST /login] missing either email or password from body!`, { email, password });
      res.status(403).send({ ok: false });
      return;
    }

    const foundUser = await req.databaseProvider.accounts.selectByEmail(email);

    if (!foundUser || !foundUser?.email || !foundUser?.password) {
      console.log(`[POST /login][ERROR] found user from database is missing either email or password`, { foundUser, password, email });
      res.status(403).send({ ok: false });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, foundUser.password);
    if (!isValidPassword) {
      console.log(`[POST /login][ERROR] incorrect password!`);
      res.status(403).send({ ok: false });
      return;
    }

    const { name, id, email: foundEmail } = foundUser;
    const jwt = generateSessionToken(name, id, foundEmail);
    await req.databaseProvider.sessions.upsert(foundUser.id, jwt.signed);

    res.status(200).send({ ok: true, session: jwt.signed });
  } catch (e) {
    console.log(`[POST /login][ERROR]`, e);
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
    const { session } = req.cookies.session;
    await req.databaseProvider.sessions.delete(session);
    res.clearCookie("session");
    res.status(200).send({ ok: true });
  } catch (e) {
    console.error("Error during logout", e);
    res.clearCookie("session");
    res.status(500).send({ ok: false });
  }
});

/**
 * Serve React to everything else
 *
 * @route {GET} *
 */
app.get("*", (req: Request, res: Response) => {
  console.log("serving", req.url);
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
