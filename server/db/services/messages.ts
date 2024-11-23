import { v7 as uuidV7 } from "uuid";
import sqlite3 from "sqlite3";
sqlite3.verbose();

export default {
  insertMessage,
  selectByRoomId: selectMessagesByRoomId,
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

async function selectMessagesByRoomId(db: sqlite3.Database, roomId: string): Promise<Message[]> {
  return new Promise((resolve, reject) => {
    try {
      const query = `
      SELECT
        messages.id AS messageId,
        messages.roomId,
        user.id AS userId,
        user.name AS userName,
        messages.message,
        messages.color,
        messages.timestamp
      FROM
        messages
      JOIN 
          "user"
      ON
        messages.userId = user.id
      WHERE
        messages.roomId = ?
      ORDER BY
        messages.timestamp ASC;`;

      db.all(query, [roomId], (err, rows: Message[]) => {
        if (err) {
          console.error("[messagesService][selectMessagesByRoomId][ERROR] Error getting messages:", err);
          return reject(err);
        }
        return resolve(rows);
      });
    } catch (e) {
      console.log(`[messagesService][selectMessagesByRoomId][ERROR]`, e);
      return reject(e);
    }
  });
}
