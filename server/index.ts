import path from "path";
import express, { Request, Response, Express } from "express";
import helmet, { HelmetOptions } from "helmet";
import morgan from "morgan";
import jsonwebtoken from "jsonwebtoken";
import { useJwtSession, useHasValidSessionCookie, useCookieParser, useCspNonce, useDatabasePool, useErrorCatchall } from "@/server/middleware";
import { sessionService } from "@/server/db/services";
import apiRouter from "@/server/routers/api";

export default function createExpressApp<T>(databasePool: DatabasePool<T>): Express {
  const app = express();

  const useJwt = useJwtSession({ onError: (_, res: Response) => res.redirect("/") });
  const helmetConfig: HelmetOptions = {
    // @ts-ignore
    contentSecurityPolicy: { directives: { scriptSrc: ["'self'", (_, res: Response) => `'nonce-${res.locals.cspNonce}'`] } },
  };

  app.set("view engine", "pug");
  app.set("views", path.resolve(__dirname, "../www"));
  app.use("/public", express.static(path.resolve(__dirname, "../www/public")));
  app.use(express.json());
  app.use(useDatabasePool(databasePool));
  app.use(useCookieParser);
  app.use(useCspNonce);
  app.use(helmet(helmetConfig));

  if (process.env.NODE_ENV !== "test") {
    morgan.token("body", (req: Request) => JSON.stringify(req.body || {}, null, 2));
    const morganSchema = ":date[clf] :method :url :status :response-time ms - :res[content-length] :body";
    const morganSkip = (req: Request) => req.url === "./favicon.ico" || (req.url || "").startsWith("/public");
    app.use(morgan(morganSchema, { skip: morganSkip }));
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

  return app;
}
