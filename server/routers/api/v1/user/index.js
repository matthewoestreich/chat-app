import express from "express";
import jsonwebtoken from "jsonwebtoken";
import { chatService } from "#@/db/services/index.js";

const router = express.Router();

/**
 * @route {POST} /rooms
 * we get userId from the jwt.
 */
router.post("/rooms", async (req, res) => {
  try {
    const { id: userId } = jsonwebtoken.decode(req.cookies.session);
    if (!userId) {
      console.log("no userid");
      return res.status(400).send({ ok: false, message: "missing required parameter" });
    }
    const db = await req.dbPool.getConnection();
    const rooms = await chatService.selectRoomsByUserId(db, userId);
    req.dbPool.releaseConnection(db);
    res.status(200).send({ ok: true, rooms });
  } catch (e) {
    console.log(e);
    return res.status(500).send({ ok: false, message: "error", error: e.message });
  }
});

export default router;
