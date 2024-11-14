import express from "express";
import jsonwebtoken from "jsonwebtoken";
import { useJwt, useHasValidSessionCookie } from "#@/server/middleware/index.js";
import { refreshTokenService } from "#@/db/services/index.js";

const router = express.Router();

const jwtMiddleware = useJwt({
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
  const { name, email } = jsonwebtoken.decode(req.cookies.access_token);
  console.log({ from: "/v2/chat", "req.user": { name, email } });
  res.render("v2/chat", { nonce: res.locals.cspNonce, name, email });
});

router.get("/logout", async (req, res) => {
  try {
    const db = await req.dbPool.getConnection();
    await refreshTokenService.delete(db, req.cookies.refresh_token);
    req.dbPool.releaseConnection(db);
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
    return res.render("v2/logout");
  } catch (e) {
    return res.render("error", { error: "Error logging you out." });
  }
});

export default router;
