import SQLite3Pool from "#@/db/SQLite3Pool.js";
import path from "path";

const dbpath = path.resolve(import.meta.dirname, "../db/rtchat.db");
console.log(dbpath);
const pool = new SQLite3Pool(dbpath, 5);
const db = await pool.getConnection();
db.get(`SELECT * FROM user`, [], (err, row) => {
  if (err) {
    console.log(`[error]`, err);
    return;
  }
  console.log(`[success]`, row);
});
