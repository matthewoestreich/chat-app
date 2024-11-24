// @ts-nocheck
import path from "path";
import sqlite3 from "sqlite3";
sqlite3.verbose();

export default async function () {
  return new Promise((resolve, reject) => {
    try {
      const db = new sqlite3.Database(path.resolve(__dirname, process.env.ABSOLUTE_DB_PATH));
      db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        db.run(`CREATE TABLE IF NOT EXISTS "user" (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL, 
          password TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          --CONSTRAINT user_pk PRIMARY KEY (id),
          CHECK(length(id) = 36)
        );`);
        db.run(`CREATE TABLE IF NOT EXISTS room (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          isPrivate BOOLEAN NOT NULL CHECK (isPrivate IN (0, 1)),
          --CONSTRAINT room_pk PRIMARY KEY (id),
          CHECK(length(id) = 36)
        );`);
        db.run(`CREATE TABLE IF NOT EXISTS chat (
          roomId TEXT NOT NULL,
          userId TEXT NOT NULL,
          CONSTRAINT chat_room_FK FOREIGN KEY (roomId) REFERENCES room(id),
          CONSTRAINT chat_user_FK FOREIGN KEY (userId) REFERENCES "user"(id),
          CHECK(length(roomId) = 36 AND length(userId) = 36)
        );`);
        db.run(`CREATE TABLE IF NOT EXISTS session (
          userId TEXT PRIMARY KEY,
          token TEXT NOT NULL,
          CONSTRAINT session_user_FK FOREIGN KEY (userId) REFERENCES "user"(id),
          CHECK(length(userId) = 36)
        );`);
        db.run(`CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          roomId TEXT NOT NULL,
          userId TEXT NOT NULL,
          message TEXT NOT NULL,
          color TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_roomId_timestamp ON messages (roomId, timestamp);`);
        db.run(`CREATE TRIGGER IF NOT EXISTS enforce_messages_limit 
          AFTER INSERT ON messages
          WHEN (SELECT COUNT(*) FROM messages WHERE roomId = NEW.roomId) > 50
          BEGIN
              DELETE FROM messages
              WHERE id = (
                  SELECT id
                  FROM messages
                  WHERE roomId = NEW.roomId
                  ORDER BY timestamp ASC
                  LIMIT 1
              );
          END;`);
        db.run("COMMIT");
        db.close();
        resolve();
      });
    } catch (e) {
      reject(e);
    }
  });
}
