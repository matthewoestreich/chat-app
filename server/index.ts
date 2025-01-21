import { Server, IncomingMessage, ServerResponse } from "node:http";
import path from "path";
import express, { Request, Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import jsonwebtoken from "jsonwebtoken";
import { useJwtSession, useHasValidSessionCookie, useCookieParser, useCspNonce, useDatabasePool, useErrorCatchall } from "@/server/middleware";
import { sessionService } from "@/server/db/services";
import SQLitePool from "@/server/db/SQLitePool.js";
import apiRouter from "@/server/routers/api";

const app = express();

export default function startExpressApp(): Promise<Server<typeof IncomingMessage, typeof ServerResponse>> {
  console.log({ from: "./server/index.ts", task: "startExpressApp", databasePath: process.env.ABSOLUTE_DB_PATH });
  return new Promise((resolve, reject) => {
    try {
      resolve(app.listen(process.env.EXPRESS_PORT));
    } catch (e) {
      reject(e);
    }
  });
}

app.set("view engine", "pug");
app.set("views", path.resolve(__dirname, "../www"));

app.use("/public", express.static(path.resolve(__dirname, "../www/public")));

const dbFilePath = process.env.ABSOLUTE_DB_PATH!;
const sqlitePool = new SQLitePool(dbFilePath, 5);

const useJwt = useJwtSession({
  onError: (_, res: Response) => res.redirect("/"),
});

app.use(express.json());
app.use(useDatabasePool(sqlitePool));
app.use(useCookieParser);
app.use(useCspNonce);

app.use(
  helmet({
    contentSecurityPolicy: {
      // @ts-ignore
      directives: { scriptSrc: ["'self'", (_, res: Response) => `'nonce-${res.locals.cspNonce}'`] },
    },
  }),
);

if (process.env.NODE_ENV !== "test") {
  // Custom token to log body of requests
  morgan.token("body", (req: Request) => {
    return JSON.stringify(req.body || {}, null, 2);
  });

  app.use(
    morgan(":date[clf] :method :url :status :response-time ms - :res[content-length] :body", {
      skip: (req) => req.url === "./favicon.ico" || (req.url || "").startsWith("/public"),
    }),
  );
}

/** ATTACH ROUTERS */
app.use("/api", apiRouter);

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
  const { name, email, id } = jsonwebtoken.decode(req.cookies.session) as SessionToken;
  res.render("chat", { nonce: res.locals.cspNonce, name, email, id, websocketUrl: process.env.WSS_URL });
});

/**
 * @route {GET} /logout
 */
app.get("/logout", async (req: Request, res: Response) => {
  try {
    const { session } = req.cookies.session;

    const connection = await req.databasePool.getConnection();

    if (await sessionService.delete(connection.db, session)) {
      connection.release();
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
