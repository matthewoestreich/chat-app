import express from "express";
import jsonwebtoken from "jsonwebtoken";
import { useJwtSession, useHasValidSessionCookie } from "#@/server/middleware/index.js";
import { refreshTokenService, sessionService } from "#@/db/services/index.js";

const router = express.Router();

const jwtMiddleware = useJwtSession({
  onError: (_req, res) => {
    return res.redirect("/v2");
  },
});

/**
 * "GET" ROUTES
 */

router.get("/", [useHasValidSessionCookie], (req, res) => {
  res.render("v2/index", { nonce: res.locals.cspNonce });
});

router.get("/chat", [jwtMiddleware], (req, res) => {
  const { name, email } = jsonwebtoken.decode(req.cookies.session);
  res.render("v2/chat", { nonce: res.locals.cspNonce, name, email, websocketUrl: process.env.WSS_URL });
});

router.get("/logout", async (req, res) => {
  try {
    const { session } = req.cookies.session;
    if (!session) {
      return res.render("v2/logout");
    }
    const db = await req.dbPool.getConnection();
    await sessionService.delete(db, session);
    req.dbPool.releaseConnection(db);
    res.clearCookie("session");
    return res.render("v2/logout");
  } catch (e) {
    return res.render("error", { error: "Error logging you out." });
  }
});

export default router;
