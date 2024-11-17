import express, { Request, Response } from "express";
import jsonwebtoken from "jsonwebtoken";
import { useJwtSession, useHasValidSessionCookie } from "@/server/middleware/index.js";
import { sessionService } from "@/server/db/services/index.js";

const router = express.Router();

const jwtMiddleware = useJwtSession({
  onError: (_req: Request, res: Response) => {
    return res.redirect("/v2");
  },
});

/**
 * @route {GET} /
 */
router.get("/", [useHasValidSessionCookie], (_req: Request, res: Response) => {
  res.render("v2/index", { nonce: res.locals.cspNonce });
});

/**
 * @route {GET} /chat
 */
router.get("/chat", [jwtMiddleware], (req: Request, res: Response) => {
  const { name, email } = jsonwebtoken.decode(req.cookies.session) as SessionToken;
  res.render("v2/chat", { nonce: res.locals.cspNonce, name, email, websocketUrl: process.env.WSS_URL });
});

/**
 * @route {GET} /logout
 */
router.get("/logout", async (req: Request, res: Response) => {
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

    return res.render("v2/logout");
  } catch (e) {
    console.log({ logoutError: e });
    return res.render("error", { error: "Error logging you out." });
  }
});

export default router;
