/*
  Auth Router
*/
import express, { Request, Response } from "express";
import { v7 as uuidv7 } from "uuid";
import bcrypt from "bcrypt";
import { generateSessionToken } from "@/server/generateTokens.js";
import { accountService, sessionService } from "@/server/db/services/index.js";

const authRouter = express.Router();

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
authRouter.post("/register", async (req: Request, res: Response) => {
  try {
    const { u: username, p: password, e: email } = req.body;
    if (!username) {
      console.log(`[POST /register] missing username (as 'p') in request body!`, { user: req.body });
      res.status(403).send({ ok: false });
      return;
    }
    const { db, release } = await req.databasePool.getConnection();
    const result = (await accountService.insert(db, username, uuidv7(), password, email)) as Account;
    release();

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
 *    e: string, // email
 *    p: string, // password
 * }
 */
authRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const { p: password, e: email } = req.body;
    if (!password || !email) {
      console.log(`[POST /login] missing either email or password from body!`, { email, password });
      res.status(403).send({ ok: false });
      return;
    }

    const { db, release } = await req.databasePool.getConnection();
    const foundUser = await accountService.selectByEmail(db, email);

    if (!foundUser || !foundUser?.email || !foundUser?.password) {
      console.log(`[POST /login][ERROR] found user from database is missing either email or password`, { password, email });
      res.status(403).send({ ok: false });
      return release();
    }

    const isValidPassword = await bcrypt.compare(password, foundUser.password);
    if (!isValidPassword) {
      console.log(`[POST /login][ERROR] incorrect password!`);
      res.status(403).send({ ok: false });
      return release();
    }

    const { name, id, email: foundEmail } = foundUser;
    const sessionToken = generateSessionToken(name, id, foundEmail);
    await sessionService.upsert(db, foundUser.id, sessionToken);
    release();

    res.status(200).send({ ok: true, session: sessionToken });
  } catch (e) {
    console.log(`[POST /login][ERROR]`, e);
    res.status(500).send({ ok: false });
  }
});

export default authRouter;
