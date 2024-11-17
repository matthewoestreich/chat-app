import express, { Request, Response } from "express";
import jsonwebtoken from "jsonwebtoken";
import { chatService } from "@/server/db/services/index.js";

const router = express.Router();

/**
 * @route {POST} /rooms
 * we get userId from the jwt.
 */
router.post("/rooms", async (req: Request, res: Response) => {
  try {
    const { userId } = jsonwebtoken.decode(req.cookies.session) as Session;

    if (!userId) {
      console.log("no userid");
      res.status(400).send({ ok: false, message: "missing required parameter" });
      return;
    }

    const { db, release } = await req.databasePool.getConnection();
    const rooms = await chatService.selectRoomsByUserId(db, userId);
    release();

    res.status(200).send({ ok: true, rooms });
  } catch (e: unknown) {
    console.log(e);
    res.status(500).send({ ok: false, message: "error", error: (e as Error).message });
    return;
  }
});

export default router;
