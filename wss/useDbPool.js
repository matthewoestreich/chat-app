import SQLite3Pool from "#@/db/SQLite3Pool.js";
import path from "path";

const dbpath = path.resolve(import.meta.dirname, "../db/rtchat.db");

export default function (socket, data) {
  try {
    socket.dbPool = new SQLite3Pool(dbpath, 5);
    return true;
  } catch (e) {
    return false;
  }
}
