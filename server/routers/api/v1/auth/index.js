/*
  Auth Router
*/
import express, { raw } from "express";
import { v7 as uuidv7 } from "uuid";
import bcrypt from "bcrypt";
import jsonwebtoken from "jsonwebtoken";
import insertAccount from "./insertAccount.js";
import { selectAccountByEmail } from "./selectAccount.js";

const authRouter = express.Router();

/** ------------------------------------------------------------------------------
 * MIDDLEWARE
 ------------------------------------------------------------------------------ */

// Add user specific properties to req object.
// u=username, p=password, e=email, ui=userId
authRouter.use((req, res, next) => {
  const { u, p, e, ui } = req.body;
  if (!u || !p || !e) {
    res.status(400).send({ ok: false });
    return;
  }
  req.user = { username: u, password: p, userId: ui, email: e };
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
 *    e: email,  // email
 * }
 */
authRouter.post("/register", async (req, res) => {
  try {
    const { username, password, email } = req.user;
    const result = await insertAccount(req.db, username, uuidv7(), password, email);
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
  try {
    const { username, password, email } = req.user;
    console.log({ got: { username, password, email } });
    const foundUser = await selectAccountByEmail(req.db, email);
    console.log({ foundUser });
    if (!foundUser || !foundUser?.name || foundUser?.name !== username || !foundUser?.email || !foundUser?.password) {
      res.status(403).send({ ok: false });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, foundUser.password);
    if (!isValidPassword) {
      console.log("invalid pw");
      res.status(403).send({ ok: false });
      return;
    }

    const rawToken = { id: foundUser.id };
    const jwtOptions = { expiresIn: "30m" };
    const jwt = jsonwebtoken.sign(rawToken, process.env.JWT_SIGNATURE, jwtOptions);
    res.status(200).send({ ok: true, token: jwt });
  } catch (e) {
    console.log(`[POST /login][ERROR]`, e);
    res.status(500).send({ ok: false });
  }
});

export default authRouter;
