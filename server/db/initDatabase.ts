// @ts-nocheck
import path from "path";
import sqlite3 from "sqlite3";
sqlite3.verbose();

export default async function () {
  return new Promise((resolve, reject) => {
    try {
      const db = new sqlite3.Database(path.resolve(import.meta.dirname, "../server/db/rtchat.db"));
      db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        db.run(`CREATE TABLE IF NOT EXISTS "user" (
          id TEXT NOT NULL,
          name TEXT NOT NULL, 
          password TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          CONSTRAINT user_pk PRIMARY KEY (id),
          CHECK(length(id) = 36)
        );`);
        db.run(`CREATE TABLE IF NOT EXISTS room (
          id TEXT NOT NULL,
          name TEXT NOT NULL,
          CONSTRAINT room_pk PRIMARY KEY (id),
          CHECK(length(id) = 36)
        );`);
        db.run(`CREATE TABLE IF NOT EXISTS chat (
          roomId TEXT NOT NULL,
          userId TEXT NOT NULL,
          CONSTRAINT chat_room_FK FOREIGN KEY (roomId) REFERENCES room(id),
          CONSTRAINT chat_user_FK FOREIGN KEY (userId) REFERENCES "user"(id),
          CHECK(length(roomId) = 36 AND length(userId) = 36)
        );`);
        /*
        db.run(`CREATE TABLE IF NOT EXISTS refresh_token (
          userId TEXT NOT NULL,
          token TEXT NOT NULL,
          CONSTRAINT refresh_token_user_FK FOREIGN KEY (userId) REFERENCES "user"(id),
          CHECK(length(userId) = 36)
        );`);
        */
        db.run(`CREATE TABLE IF NOT EXISTS session (
          userId TEXT NOT NULL,
          token TEXT NOT NULL,
          CONSTRAINT session_user_FK FOREIGN KEY (userId) REFERENCES "user"(id),
          CHECK(length(userId) = 36)
        );`);
        db.run("COMMIT");
      });
      db.close();
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}
