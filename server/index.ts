import path from "path";
import express, { Request, Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import jsonwebtoken from "jsonwebtoken";
import { useErrorCatchall } from "@/server/middleware";
import { useJwtSession, useHasValidSessionCookie, useCookieParser, useCspNonce, useDatabasePool } from "@/server/middleware";
import { sessionService } from "@/server/db/services";
import SQLitePool from "@/server/db/SQLitePool.js";
import apiRouter from "@/server/routers/api";

const app = express();

app.set("view engine", "ejs");
app.set("views", path.resolve(__dirname, "../www"));

app.use("/public", express.static(path.resolve(__dirname, "../www/public")));

const dbFilePath = process.env.ABSOLUTE_DB_PATH || "";
const sqlitePool = new SQLitePool(dbFilePath, 5);
morgan.token("body", (req: any) => JSON.stringify(req.body || {}, null, 2)); // custom logging 'token' to log req bodies.

app.use(express.json());
app.use(useDatabasePool(sqlitePool));
app.use(useCookieParser);
app.use(useCspNonce);
app.use(
  helmet({
    contentSecurityPolicy: {
      // @ts-ignore
      directives: { scriptSrc: ["'self'", (_req: Request, res: Response) => `'nonce-${res.locals.cspNonce}'`] },
    },
  }),
);
app.use(
  morgan(":date[clf] :method :url :status :response-time ms - :res[content-length] :body", {
    skip: (req, _res) => req.url === "./favicon.ico" || (req.url || "").startsWith("/public"),
  }),
);

/** ATTACH ROUTERS */
app.use("/api", apiRouter);

const jwtMiddleware = useJwtSession({
  onError: (_req: Request, res: Response) => {
    return res.redirect("/");
  },
});

/**
 * @route {GET} /
 */
app.get("/", [useHasValidSessionCookie], (_req: Request, res: Response) => {
  res.render("index", { nonce: res.locals.cspNonce });
});

/**
 * @route {GET} /chat
 */
app.get("/chat", [jwtMiddleware], (req: Request, res: Response) => {
  const { name, email } = jsonwebtoken.decode(req.cookies.session) as SessionToken;
  res.render("chat", { nonce: res.locals.cspNonce, name, email, websocketUrl: process.env.WSS_URL });
});

/**
 * @route {GET} /logout
 */
app.get("/logout", async (req: Request, res: Response) => {
  try {
    const { session } = req.cookies.session;
    console.log({ "req.cookies": req.cookies, sessionBeforeRemove: req.cookies.session });

    const connection = await req.databasePool.getConnection();

    if (await sessionService.delete(connection.db, session)) {
      console.log("successfully removed session token from db.");
      connection.release();
      req.cookies.session = "";
      res.clearCookie("session");
      console.log({ sessionAfterRemove: req.cookies.session });
    }

    return res.render("logout");
  } catch (e) {
    console.log({ logoutError: e });
    return res.render("error", { error: "Error logging you out." });
  }
});

/**
 * 404 route
 * @route {GET} *
 */
app.get("*", (_req, res) => {
  res.send("<h1>404 Not Found</h1>");
});

/**
 * Catch-all error handler
 */
app.use(useErrorCatchall);

export default app.listen(process.env.EXPRESS_PORT, () => {
  console.log(`Express app listening on port ${process.env.EXPRESS_PORT}!`);
});
