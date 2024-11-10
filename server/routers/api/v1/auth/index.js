/*
  Auth Router
*/
import express, { raw } from "express";
import { v7 as uuidv7 } from "uuid";
import bcrypt from "bcrypt";
import jsonwebtoken from "jsonwebtoken";
import insertAccount from "./insertAccount.js";
import selectAccount from "./selectAccount.js";

const authRouter = express.Router();

/** ------------------------------------------------------------------------------
 * MIDDLEWARE
 ------------------------------------------------------------------------------ */

// Every request sent to this endpoint should have a JSON body containing
// a "u" and "p" fields. "u" represents username, "p" represents password.
// Optionally, on some requests, a field containeing the userId, aka "ui", may be required.
// In summary: { u: <required>username, p: <required>password, ui: <optional>userId }
// This middleware attaches "u", "p", "ui" to the "req" obj as "req.u", "req.p", and "req.ui".
authRouter.use((req, res, next) => {
  const { u, p, ui } = req.body;
  if (!u || !p) {
    res.status(400).send({ ok: false });
    return;
  }
  req.u = u;
  req.p = p;
  req.ui = ui; // Add "ui" regardless. If it does not exist it will just show as 'undefined'.
  next();
});

/** ------------------------------------------------------------------------------
 * ROUTES
 ------------------------------------------------------------------------------ */

/**
 * @route {POST} /register
 * Content-Type: application/json
 * {
 *    u: string, // username
 *    p: string, // password
 * }
 */
authRouter.post("/register", async (req, res) => {
  try {
    const result = await insertAccount(req.db, req.u, uuidv7(), req.p);
    console.log({ result });
    res.status(200).send({ ok: true, ...result });
  } catch (e) {
    console.log(`[POST /register][ERROR]`, { e });
    res.status(500).send({ ok: false });
  }
});

/**
 * @route {POST} /login
 * Content-Type: application/json
 * {
 *    u: string, // username
 *    ui: string, // userid - must be valid uuid version 7
 *    p: string, // password
 * }
 */
authRouter.post("/login", async (req, res) => {
  if (!req.ui) {
    console.log(`[POST /login][ERROR] missing user id param!`);
    res.status(400).send({ ok: false });
    return;
  }
  try {
    const user = await selectAccount(req.db, req.u, req.ui);
    if (!user || !user?.name || user?.name !== req.u) {
      res.status(403).send({ ok: false });
      return;
    }

    const isValidPassword = await bcrypt.compare(req.p, user.password);
    if (!isValidPassword) {
      res.status(403).send({ ok: false });
      return;
    }

    const rawToken = { id: user.id };
    const jwtOptions = { expiresIn: "30m" };
    const jwt = jsonwebtoken.sign(rawToken, process.env.JWT_SIGNATURE, jwtOptions);
    res.status(200).send({ ok: true, token: jwt });
  } catch (e) {
    console.log(`[POST /login][ERROR]`, e);
    res.status(500).send({ ok: false });
  }
});

export default authRouter;
