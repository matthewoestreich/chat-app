/*
  Auth Router
*/
import express, { raw } from "express";
import { v7 as uuidv7 } from "uuid";
import bcrypt from "bcrypt";
import jsonwebtoken from "jsonwebtoken";
import { useUserParamsFromBody } from "#@/server/middleware/index.js";
import { insertAccount, selectAccountByEmail } from "#@/db/queries/index.js";

const authRouter = express.Router();

/** ------------------------------------------------------------------------------
 * MIDDLEWARE
 ------------------------------------------------------------------------------ */

// Add user specific properties to req object.
// u=username, p=password, e=email, ui=userId
authRouter.use(useUserParamsFromBody("userBody"));

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
    const { username, password, email } = req.userBody;
    if (!username) {
      console.log(`[POST /register] missing username (as 'p') in request body!`, { user: req.userBody });
      res.status(403).send({ ok: false });
      return;
    }
    const db = await req.dbPool.getConnection();
    const result = await insertAccount(db, username, uuidv7(), password, email);
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
 *    e: string, // email
 *    p: string, // password
 * }
 */
authRouter.post("/login", async (req, res) => {
  try {
    const { password, email } = req.userBody;
    if (!password || !email) {
      console.log(`[POST /login] missing either email or password from body!`, { email, password });
      res.status(403).send({ ok: false });
      return;
    }

    const db = await req.dbPool.getConnection();
    const foundUser = await selectAccountByEmail(db, email);
    req.dbPool.releaseConnection(db);

    if (!foundUser || !foundUser?.email || !foundUser?.password) {
      console.log(`[POST /login][ERROR] found user from database is missing either email or password`, { password, email });
      res.status(403).send({ ok: false });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, foundUser.password);
    if (!isValidPassword) {
      console.log(`[POST /login][ERROR] incorrect password!`);
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
