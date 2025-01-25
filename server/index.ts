import path from "path";
import express, { Request, Response } from "express";
import helmet, { HelmetOptions } from "helmet";
import { v7 as uuidv7 } from "uuid";
import bcrypt from "bcrypt";
import { generateSessionToken } from "@/server/generateTokens.js";
import morgan from "morgan";
import jsonwebtoken from "jsonwebtoken";
import { useJwtSession, useHasValidSessionCookie, useCookieParser, useCspNonce, useErrorCatchall, attachDatabaseProvider } from "@/server/middleware";

const app = express();
export const setDatabaseProvider = attachDatabaseProvider(app);
export default app;

const useJwt = useJwtSession({ onError: (_, res: Response) => res.redirect("/") });
const helmetConfig: HelmetOptions = {
  // @ts-ignore
  contentSecurityPolicy: { directives: { scriptSrc: ["'self'", (_, res: Response) => `'nonce-${res.locals.cspNonce}'`] } },
};

app.set("view engine", "pug");
app.set("views", path.resolve(__dirname, "../www"));
app.use("/public", express.static(path.resolve(__dirname, "../www/public")));
app.use(express.json());
app.use(useCookieParser);
app.use(useCspNonce);
app.use(helmet(helmetConfig));

if (process.env.NODE_ENV !== "test") {
  morgan.token("body", (req: Request) => JSON.stringify(req.body || {}, null, 2));
  const morganSchema = ":date[clf] :method :url :status :response-time ms - :res[content-length] :body";
  const morganSkip = (req: Request) => req.url === "./favicon.ico" || (req.url || "").startsWith("/public");
  app.use(morgan(morganSchema, { skip: morganSkip }));
}

/**
 * @route {GET} /
 */
app.get("/", [useHasValidSessionCookie], (_req: Request, res: Response) => {
  res.render("index", { nonce: res.locals.cspNonce });
});

/**
 * @route {GET} /chat
 */
app.get("/chat", [useJwt], (req: Request, res: Response) => {
  const { name, email, id } = jsonwebtoken.decode(req.cookies.session) as JSONWebToken;
  res.render("chat", { nonce: res.locals.cspNonce, name, email, id, websocketUrl: process.env.WSS_URL });
});

/**
 * @route {GET} /logout
 */
app.get("/logout", async (req: Request, res: Response) => {
  try {
    const { session } = req.cookies.session;

    //if (await sessionService.delete(connection.db, session)) {
    if (await req.databaseProvider.sessions.delete(session)) {
      req.cookies.session = "";
      res.clearCookie("session");
    }
    return res.render("logout");
  } catch (e) {
    res.clearCookie("session");
    return res.render("logout");
  }
});

/**
 * @route {POST} /auth/register
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
    console.log(req.databaseProvider);
    const result = await req.databaseProvider.accounts.create({ name: username, id: uuidv7(), email, password });
    res.status(200).send({ ok: true, ...result });
  } catch (e) {
    console.log(`[POST /register][ERROR]`, { e });
    res.status(500).send({ ok: false });
  }
});

/**
 * @route {POST} /auth/login
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

    console.log(req.databaseProvider?.accounts);
    const foundUser = await req.databaseProvider.accounts.selectByEmail(email);

    if (!foundUser || !foundUser?.email || !foundUser?.password) {
      console.log(`[POST /login][ERROR] found user from database is missing either email or password`, { password, email });
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
    await req.databaseProvider.sessions.upsert({ userId: foundUser.id, token: jwt.signed }); //sessionService.upsert(db, foundUser.id, jwt.signed);

    res.status(200).send({ ok: true, session: jwt.signed });
  } catch (e) {
    console.log(`[POST /login][ERROR]`, e);
    res.status(500).send({ ok: false });
  }
});

/**
 * 404 route
 * @route {GET} *
 */
app.get("*", (_, res: Response) => {
  res.send("<h1>404 Not Found</h1>");
});

/**
 * Catch-all error handler
 */
app.use(useErrorCatchall);

app.listenAsync = function (...args: any[]) {
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
