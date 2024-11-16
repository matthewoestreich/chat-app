import { Application, Request, Response } from "express";
import path from "path";
import helmet from "helmet";
import morgan from "morgan";
import { useCookieParser, useCspNonce, useDatabasePool } from "@/server/middleware/index.js";
import SQLitePool from "@/server/db/SQLitePool.js";

export default function (app: Application) {
  // Create database pool
  const dbFilePath = path.resolve(import.meta.dirname, "./db/rtchat.db");
  const sqlitePool = new SQLitePool(dbFilePath, 5);
  app.use(useDatabasePool(sqlitePool));

  // Set a nonce on scripts
  app.use(useCspNonce);

  // Tighten security
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          // @ts-ignore
          scriptSrc: ["'self'", (_req: Request, res: Response) => `'nonce-${res.locals.cspNonce}'`],
        },
      },
    }),
  );

  // Parses cookies into req.cookies
  app.use(useCookieParser);

  // Logging
  morgan.token("body", (req: any) => JSON.stringify(req.body || {}, null, 2)); // custom logging 'token' to log POST bodies.
  app.use(
    morgan(":date[clf] :method :url :status :response-time ms - :res[content-length] :body", {
      skip: (req, _res) => req.url === "./favicon.ico" || (req.url || "").startsWith("/public"),
    }),
  );
}
