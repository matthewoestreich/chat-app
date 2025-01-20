// @ts-nocheck
import path from "path";
import sqlite3 from "sqlite3";
sqlite3.verbose();

export default async function (databaseFilePath: string) {
  if (databaseFilePath === "") {
    console.error(`initDatabase : databaseFilePath is empty!`);
    return;
  }

  console.log("Initializing database...");

  return new Promise((resolve, reject) => {
    try {
      const db = new sqlite3.Database(path.resolve(__dirname, databaseFilePath));
      db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        db.run(`
          CREATE TABLE IF NOT EXISTS "user" (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL, 
            password TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            CHECK(length(id) = 36)
          );`);
        db.run(`
          CREATE TABLE IF NOT EXISTS room (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            isPrivate BOOLEAN NOT NULL CHECK (isPrivate IN (0, 1)),
            CHECK(length(id) = 36)
          );`);
        db.run(`
          CREATE TABLE IF NOT EXISTS chat (
            roomId TEXT NOT NULL,
            userId TEXT NOT NULL,
            PRIMARY KEY (userId, roomId),
            CONSTRAINT chat_room_FK FOREIGN KEY (roomId) REFERENCES room(id),
            CONSTRAINT chat_user_FK FOREIGN KEY (userId) REFERENCES "user"(id),
            CHECK(length(roomId) = 36 AND length(userId) = 36)
          );`);
        db.run(`
          CREATE TABLE IF NOT EXISTS session (
            userId TEXT PRIMARY KEY,
            token TEXT NOT NULL,
            CONSTRAINT session_user_FK FOREIGN KEY (userId) REFERENCES "user"(id),
            CHECK(length(userId) = 36)
          );`);
        db.run(`
          CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            roomId TEXT NOT NULL,
            userId TEXT NOT NULL,
            message TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
          );`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_roomId_timestamp ON messages (roomId, timestamp);`);
        db.run(` -- Trigger to only store 50 messages per room.
          CREATE TRIGGER IF NOT EXISTS enforce_messages_limit 
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
        db.run(`
          CREATE TABLE IF NOT EXISTS direct_conversation (
            id TEXT PRIMARY KEY,
            userA_Id TEXT NOT NULL,
            userB_Id TEXT NOT NULL
          );`);
        db.run(`
          CREATE TABLE IF NOT EXISTS direct_messages (
            id TEXT PRIMARY KEY,
            directConversationId TEXT NOT NULL,
            fromUserId TEXT NOT NULL,
            toUserId TEXT NOT NULL,
            message TEXT NOT NULL,
            isRead BOOLEAN NOT NULL CHECK (isRead IN (0, 1)),
            "timestamp" DATETIME DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT direct_messages_direct_conversation_FK FOREIGN KEY (directConversationId) REFERENCES direct_conversation(id)
          );`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_fromUserId_timestamp ON direct_messages (fromUserId, timestamp);`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_fromUserId_toUserId_timestamp ON direct_messages (fromUserId, toUserId, timestamp);`);
        db.run(` -- Trigger to only store 50 messages per DM.
          CREATE TRIGGER IF NOT EXISTS enforce_direct_messages_message_limit 
          AFTER INSERT ON direct_messages 
          WHEN (SELECT COUNT(*) FROM direct_messages WHERE directConversationId = NEW.directConversationId) > 50 
          BEGIN 
            DELETE FROM direct_messages WHERE id = (
              SELECT id
              FROM direct_messages
              WHERE directConversationId = NEW.directConversationId
              ORDER BY timestamp ASC
              LIMIT 1
            );
          END;`);
        db.run("COMMIT");
        db.close(() => resolve());
      });
    } catch (e) {
      reject(e);
    }
  });
}
