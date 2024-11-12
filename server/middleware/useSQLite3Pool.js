import SQLite3Pool from "#@/db/SQLite3Pool.js";
import path from "path";

const dbpath = path.resolve(import.meta.dirname, "../../db/rtchat.db");

export default function (req, res, next) {
  try {
    req.dbPool = new SQLite3Pool(dbpath, 5);
    next();
  } catch (e) {
    next(e);
  }
}
