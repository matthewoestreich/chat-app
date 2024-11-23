import { v7 as uuidV7 } from "uuid";
import sqlite3 from "sqlite3";
sqlite3.verbose();

export default {
  insertMessage,
};

async function insertMessage(db: sqlite3.Database, roomId: string, userId: string, message: string, color: string, tableName = "messages"): Promise<boolean> {
  return new Promise((resolve, reject) => {
    try {
      db.run(`INSERT INTO ${tableName} (id, roomId, userId, message, color) VALUES (?, ?, ?, ?, ?)`, [uuidV7(), roomId, userId, message, color], function (err) {
        if (err) {
          console.error("[messagesService][ERROR] Error inserting message:", err);
          return reject(err);
        }
        return resolve(true);
      });
    } catch (e) {
      console.log(`[messagesService][ERROR]`, e);
      return reject(e);
    }
  });
}
