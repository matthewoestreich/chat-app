import express from "express";

const router = express.Router();

/**
 * "GET" ROUTES
 */

router.get("/", (req, res) => {
  res.render("v2/index", { nonce: res.locals.cspNonce });
});

router.get("/chat", [], (req, res) => {
  res.send(`<code>${JSON.stringify(req.cookies, null, 2)}</code>`);
});

export default router;
