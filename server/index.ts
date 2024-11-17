import express, { Request, Response } from "express";
import jsonwebtoken from "jsonwebtoken";
import path from "path";
import { useErrorCatchall } from "@/server/middleware/index";
import { useJwtSession, useHasValidSessionCookie } from "@/server/middleware/index";
import { sessionService } from "@/server/db/services/index";
import attachMiddleware from "./attachMiddleware";
import apiRouter from "@/server/routers/api/index";

const app = express();

/** VIEW ENGINE */
app.set("view engine", "ejs");
app.set("views", path.resolve(import.meta.dirname, "../www"));

/**  MIDDLEWARES */

app.use("/public", express.static(path.resolve(import.meta.dirname, "../www/public"))); // Serve static assets
app.use(express.json()); // Parse req bodies into json (when Content-Type='application/json')
attachMiddleware(app); // Attach "third party"/"internal"/"non-standard" middleware.

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

/**
 * START SERVER
 */

export default app.listen(process.env.EXPRESS_PORT, () => {
  console.log(`Express app listening on port ${process.env.EXPRESS_PORT}!`);
});

/**
 * MISC FUNCTIONS
 */

/**
 *
 * Gets a random light color in hex format.
 * We ensure the color is light by having a bias towards colors
 * that contain values in the `A-F` range.
 *
 */
// @ts-ignore
function getRandomLightColorHex() {
  let color = "#";
  for (let i = 0; i < 6; i++) {
    // Generate a random hex digit (0-F)
    const digit = Math.floor(Math.random() * 16).toString(16);

    // Ensure the color is light by biasing towards higher values (A-F)
    if (Math.random() < 0.5) {
      color += digit;
    } else {
      color += Math.floor(Math.random() * 6 + 10).toString(16); // A-F
    }
  }
  return color;
}
