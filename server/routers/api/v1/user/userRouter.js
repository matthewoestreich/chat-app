import express from "express";
import { v7 as uuidv7 } from "uuid";
import { createNewUser } from "./queries/index.js";

const router = express.Router();

/**
 * POST /create
 */
router.post("/create", async (req, res) => {
  const { u, p } = req.body;

  if (!u || !p) {
    console.log(`[POST /user/create][ERROR] missing required param!`, { u, p });
    res.status(400).send({ ok: false });
    return;
  }

  try {
    await createNewUser(u, uuidv7(), p, req.db);
    res.status(200).send({ ok: true });
  } catch (e) {
    console.log(`[POST /user/create][ERROR]`, {e});
    res.status(500).send({ ok: false });
  }
});

/**
 * POST /login
 */
router.post("/login", );

export default router;