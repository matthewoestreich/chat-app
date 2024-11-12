import express from "express";
import { useJWT } from "#@/server/middleware/index.js";

const router = express.Router();

/**
 * "GET" ROUTES
 */

router.get("/", (req, res) => {
  res.render("v2/index", { nonce: res.locals.cspNonce });
});

router.get("/chat", [useJWT], (req, res) => {
  console.log("at /chat")
  res.render("v2/chat", { nonce: res.locals.cspNonce });
});

export default router;
