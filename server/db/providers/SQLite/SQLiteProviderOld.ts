/*
import nodeFs from "node:fs";
import sqlite3 from "sqlite3";
import SQLitePool from "./pool/SQLitePool";
import RoomsRepositorySQLite from "./repositories/RoomsRepository";
import AccountsRepositorySQLite from "./repositories/AccountsRepository";
import DirectConversationsRepositorySQLite from "./repositories/DirectConversationsRepository";
import DirectMessagesRepositorySQLite from "./repositories/DirectMessagesRepository";
import RoomsMessagesRepositorySQLite from "./repositories/RoomsMessagesRepository";
import SessionsRepositorySQLite from "./repositories/SessionsRepository";

import WebSocketApp from "@/server/wss/WebSocketApp";
import { generateFakeData, insertFakeData } from "@/scripts/fakeData";
import { backupDatabase, restoreDatabase, BACKUP_FILE_PATH, BACKUP_FILE_NAME, DATABASE_PATH } from "@/scripts/database";
import { updateGist, getGistFiles } from "@/scripts/gist";
import RoomsService from "../../services/RoomsService";
import AccountsService from "../../services/AccountsService";
import DirectMessagesService from "../../services/DirectMessagesService";
import RoomsMessagesService from "../../services/RoomsMessagesService";
import SessionsService from "../../services/SessionsService";
import DirectConversationsService from "../../services/DirectConversationsService";

const { log, error } = console;

export default class SQLiteProviderOld implements DatabaseProvider {
  private databaseFilePath: string;
  databasePool: DatabasePool<sqlite3.Database>;
  rooms: RoomsService<sqlite3.Database>;
  accounts: AccountsService<sqlite3.Database>;
  directConversations: DirectConversationsService<sqlite3.Database>;
  directMessages: DirectMessagesService<sqlite3.Database>;
  roomMessages: RoomsMessagesService<sqlite3.Database>;
  sessions: SessionsService<sqlite3.Database>;

  constructor(databaseFilePath: string, maxConnections: number) {
    this.databaseFilePath = databaseFilePath;
    this.databasePool = new SQLitePool(databaseFilePath, maxConnections);
    this.rooms = new RoomsService(new RoomsRepositorySQLite(this.databasePool));
    this.accounts = new AccountsService(new AccountsRepositorySQLite(this.databasePool));
    this.directConversations = new DirectConversationsService(new DirectConversationsRepositorySQLite(this.databasePool));
    this.directMessages = new DirectMessagesService(new DirectMessagesRepositorySQLite(this.databasePool));
    this.roomMessages = new RoomsMessagesService(new RoomsMessagesRepositorySQLite(this.databasePool));
    this.sessions = new SessionsService(new SessionsRepositorySQLite(this.databasePool));
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.databaseFilePath) {
        reject(new Error(`databaseFilePath not set!`));
      }
      try {
        const db = new sqlite3.Database(this.databaseFilePath, (err) => {
          if (err) {
            return reject(err);
          }
        });
  
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
          db.run("COMMIT", (_result: sqlite3.RunResult, err: Error | null) => {
            if (err) {
              return reject(err);
            }
            db.close((e) => {
              if (e) {
                return reject(e);
              }
              resolve();
            });
          });
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  async seed(): Promise<void> {
    const { db, release } = await this.databasePool.getConnection();
    return new Promise(async (resolve, reject) => {
      try {
        const fakeData = generateFakeData({
          userParams: {
            numberOfUsers: 5,
            makeIdentical: true,
          },
          chatRoomsParams: {
            numberOfRooms: 5,
            longNameFrequency: 3,
          },
          chatRoomsWithMembersParams: {
            minUsersPerRoom: 2,
            maxUsersPerRoom: 4,
          },
          chatRoomMessagesParams: {
            maxMessagesPerRoom: 5,
            minMessageLength: 3,
            maxMessageLength: 20,
          },
          directConversationParams: {
            minConversationsPerUser: 1,
            maxConversationsPerUser: 3,
          },
          directMessagesParams: {
            minMessagesPerConversation: 1,
            maxMessagesPerConversation: 3,
            minMessageLength: 3,
            maxMessageLength: 20,
          },
        });
    
        // Add #general Room and add everyone to it
        const generalRoom = {
          name: "#general",
          id: WebSocketApp.ID_UNASSIGNED,
          isPrivate: 0,
        };
        fakeData.rooms.push(generalRoom);
        fakeData.roomsWithMembers.push({
          room: generalRoom,
          members: fakeData.users,
        });
    
        await insertFakeData(db, fakeData);
        release();
        resolve();
      } catch (e) {
        release();
        reject(e);
      }
    });
  }

  async backup(): Promise<void> {
    if (!process.env.GH_GISTS_API_KEY) {
      return error("[backupDbAndUploadGist] gists api key not found.");
    }
    if (!process.env.GIST_ID) {
      return error("[backupDbAndUploadGist] gist id not found");
    }
  
    try {
      log("[backupDbAndUploadGist][BEGIN]");
      // Backup db to file
      log(" -> Database backup started");
      await backupDatabase(DATABASE_PATH, BACKUP_FILE_PATH);
      log("  -> Database backup complete");
      log(" -> Uploading gist.");
      // Update our gist with new data
      await updateGist(process.env.GH_GISTS_API_KEY, process.env.GIST_ID, [BACKUP_FILE_PATH]);
      log("  -> Uploaded gist.");
      // Delete local backup file after uploading gist
      log("-> Removing backup file.");
      nodeFs.unlinkSync(BACKUP_FILE_PATH);
      log("\n[backupDbAndUploadGist][SUCCESS] Done.\n");
    } catch (e) {
      if (nodeFs.existsSync(BACKUP_FILE_PATH)) {
        nodeFs.unlinkSync(BACKUP_FILE_PATH);
      }
      error(`[backupDbAndUploadGist][ERROR]`, e);
    }
  }

  async restore(): Promise<void> {
    if (!process.env.GH_GISTS_API_KEY) {
      return error("[restoreDatabaseFromGist] gists api key not found.");
    }
    if (!process.env.GIST_ID) {
      return error("[restoreDatabaseFromGist] gist id not found");
    }
  
    try {
      log(`[restoreDatabaseFromGist][BEGIN]`);
      log(` -> Getting Gist`);
      const files = await getGistFiles(process.env.GH_GISTS_API_KEY, process.env.GIST_ID);
      log(`  -> Got Gist`);
      log(` -> Writing contents to file`);
      const file = files.find((f) => f.filename === BACKUP_FILE_NAME);
      if (!file) {
        return console.error(`[restoreDbFromGist] backup file not found in gist.`);
      }
      nodeFs.writeFileSync(BACKUP_FILE_PATH, file.content);
      log(`  -> Wrote contents to file`);
      log(` -> Starting restore`);
      await restoreDatabase(DATABASE_PATH, BACKUP_FILE_PATH);
      log(` -> Removing backup file..`);
      nodeFs.unlinkSync(BACKUP_FILE_PATH);
      log(`\n[restoreDatabaseFromGist][SUCCESS] Database restored.\n`);
    } catch (e) {
      nodeFs.unlinkSync(BACKUP_FILE_PATH);
      error(`[restoreDatabaseFromGist] something went wrong restoring db from gist`, e);
    }
  }
}
  */
