import express, { Request, Response } from "express";
import jsonwebtoken from "jsonwebtoken";
import { useJwtSession, useHasValidSessionCookie } from "@/server/middleware/index.js";
import { sessionService } from "@/db/services/index.js";

const router = express.Router();

const jwtMiddleware = useJwtSession({
  onError: (_req: Request, res: Response) => {
    return res.redirect("/v2");
  },
});

/**
 * "GET" ROUTES
 */

router.get("/", [useHasValidSessionCookie], (_req: Request, res: Response) => {
  res.render("v2/index", { nonce: res.locals.cspNonce });
});

router.get("/chat", [jwtMiddleware], (req: Request, res: Response) => {
  const { name, email } = jsonwebtoken.decode(req.cookies.session) as SessionToken;
  res.render("v2/chat", { nonce: res.locals.cspNonce, name, email, websocketUrl: process.env.WSS_URL });
});

router.get("/logout", async (req: Request, res: Response) => {
  try {
    const { session } = req.cookies.session;
    if (!session) {
      return res.render("v2/logout");
    }
    const db = await req.databasePool.getConnection();
    await sessionService.delete(db, session);
    req.databasePool.releaseConnection(db);
    res.clearCookie("session");
    return res.render("v2/logout");
  } catch (e) {
    return res.render("error", { error: "Error logging you out." });
  }
});

export default router;
