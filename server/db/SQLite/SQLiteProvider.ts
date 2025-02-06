import nodeFs from "node:fs";
import nodePath from "node:path";
import sqlite3 from "sqlite3";
import { DatabasePool, DatabaseProvider, RoomsRepository, RoomsMessagesRepository, AccountsRepository, DirectConversationsRepository, DirectMessagesRepository, SessionsRepository } from "@/server/types";
import WebSocketApp from "@/server/wss/WebSocketApp";
import { generateFakeData } from "@/server/fakerService";
import { getGistFiles, updateGist } from "@/server/gistService";
import SQLitePool from "./pool/SQLitePool";
import { insertFakeData } from "./insertFakeData";
// prettier-ignore
import { 
  AccountsRepositorySQLite, 
  DirectConversationsRepositorySQLite, 
  DirectMessagesRepositorySQLite, 
  RoomsMessagesRepositorySQLite, 
  RoomsRepositorySQLite, 
  SessionsRepositorySQLite
} from "./repositories/index";
sqlite3.verbose();

export default class SQLiteProvider implements DatabaseProvider<sqlite3.Database> {
  private parseBackupFileDelimiter: string = "~~__~~";
  private backupSQLFilePath: string;
  private databaseFilePath: string;

  databasePool: DatabasePool<sqlite3.Database>;
  rooms: RoomsRepository<sqlite3.Database>;
  roomMessages: RoomsMessagesRepository<sqlite3.Database>;
  accounts: AccountsRepository<sqlite3.Database>;
  directConversations: DirectConversationsRepository<sqlite3.Database>;
  directMessages: DirectMessagesRepository<sqlite3.Database>;
  sessions: SessionsRepository<sqlite3.Database>;

  constructor(databaseFilePath: string, maxConnections: number) {
    this.databaseFilePath = databaseFilePath;
    this.backupSQLFilePath = nodePath.format({
      dir: nodePath.dirname(databaseFilePath),
      name: "sqlite",
      ext: ".sql",
    });
    this.databasePool = new SQLitePool(databaseFilePath, maxConnections);
    this.rooms = new RoomsRepositorySQLite(this.databasePool);
    this.roomMessages = new RoomsMessagesRepositorySQLite(this.databasePool);
    this.accounts = new AccountsRepositorySQLite(this.databasePool);
    this.directConversations = new DirectConversationsRepositorySQLite(this.databasePool);
    this.directMessages = new DirectMessagesRepositorySQLite(this.databasePool);
    this.sessions = new SessionsRepositorySQLite(this.databasePool);
  }

  async initialize(): Promise<void> {
    await this.createDatabaseSchema();
    const { db, release } = await this.databasePool.getConnection();

    return new Promise((resolve) => {
      try {
        db.get(`SELECT * FROM "room" WHERE id = ?`, [WebSocketApp.ID_UNASSIGNED], async (err, row) => {
          if (err) {
            release();
            return resolve();
          }
          if (!row) {
            await this.seed();
            release();
            return resolve();
          }
          release();
          resolve();
        });
      } catch (_e) {
        release();
        resolve();
      }
    });
  }

  async seed(): Promise<void> {
    const { db, release } = await this.databasePool.getConnection();
    return new Promise(async (resolve, reject) => {
      try {
        const fakeData = generateFakeData({
          userParams: {
            numberOfUsers: 100,
            makeIdentical: true,
          },
          chatRoomsParams: {
            numberOfRooms: 50,
            longNameFrequency: 5,
          },
          chatRoomsWithMembersParams: {
            minUsersPerRoom: 10,
            maxUsersPerRoom: 50,
          },
          chatRoomMessagesParams: {
            maxMessagesPerRoom: 50,
            minMessageLength: 3,
            maxMessageLength: 20,
          },
          directConversationParams: {
            minConversationsPerUser: 3,
            maxConversationsPerUser: 10,
          },
          directMessagesParams: {
            minMessagesPerConversation: 5,
            maxMessagesPerConversation: 20,
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
    console.log({ from: "SQLiteProvider", task: "Starting backup..." });
    return new Promise(async (resolve, reject) => {
      if (!process.env.GH_GISTS_API_KEY) {
        return reject(new Error("[SQLiteProvider.backup()] gists api key not found (via process.env.GH_GISTS_API_KEY)."));
      }
      if (!process.env.GIST_ID) {
        return reject(new Error("[SQLiteProvider.backup()] gist id not found (via process.env.GIST_ID)."));
      }

      try {
        await this.backupDatabaseToFile();
        await updateGist(process.env.GH_GISTS_API_KEY, process.env.GIST_ID, [this.backupSQLFilePath]);
        nodeFs.unlinkSync(this.backupSQLFilePath);
        resolve();
      } catch (e) {
        if (nodeFs.existsSync(this.backupSQLFilePath)) {
          nodeFs.unlinkSync(this.backupSQLFilePath);
        }
        reject(e);
      }
    });
  }

  async restore(): Promise<void> {
    const backupSQLFileName = nodePath.basename(this.backupSQLFilePath);

    return new Promise(async (resolve, reject) => {
      try {
        if (!process.env.GH_GISTS_API_KEY) {
          return reject(new Error("[SQLiteProvider.restore()] gists api key not found."));
        }
        if (!process.env.GIST_ID) {
          return reject(new Error("[SQLiteProvider.restore()] gist id not found"));
        }

        const files = await getGistFiles(process.env.GH_GISTS_API_KEY, process.env.GIST_ID);
        const file = files.find((f) => f.filename === backupSQLFileName);
        if (!file) {
          return reject(new Error(`[SQLiteProvider.restore()] backup file not found in gist.`));
        }
        nodeFs.writeFileSync(this.backupSQLFilePath, file.content);
        await this.restoreDatabaseFromFile();
        nodeFs.unlinkSync(this.backupSQLFilePath);
        resolve();
      } catch (e) {
        if (nodeFs.existsSync(this.backupSQLFilePath)) {
          nodeFs.unlinkSync(this.backupSQLFilePath);
        }
        reject(e);
      }
    });
  }

  private backupDatabaseToFile(): Promise<void> {
    const backupDatabaseFilePath = this.databaseFilePath;

    return new Promise((resolve, reject) => {
      try {
        if (!nodeFs.existsSync(backupDatabaseFilePath)) {
          return reject(new Error(`No database found at dbPath: '${backupDatabaseFilePath}'`));
        }

        const db = new sqlite3.Database(backupDatabaseFilePath, sqlite3.OPEN_READONLY);
        const backupStream = nodeFs.createWriteStream(this.backupSQLFilePath);

        db.serialize(() => {
          backupStream.write(`PRAGMA foreign_keys=OFF;${this.parseBackupFileDelimiter}\nBEGIN TRANSACTION;${this.parseBackupFileDelimiter}\n`);

          db.all(`SELECT sql FROM sqlite_master WHERE type IN ('table', 'index', 'trigger') AND sql NOT NULL`, (err, rows) => {
            if (err) {
              return reject(err);
            }

            rows.forEach((row) => {
              // @ts-ignore
              // prettier-ignore
              const sql = String(row.sql).trim()
                .replace("CREATE TABLE", "CREATE TABLE IF NOT EXISTS")
                .replace("CREATE INDEX", "CREATE INDEX IF NOT EXISTS")
                .replace("CREATE TRIGGER", "CREATE TRIGGER IF NOT EXISTS");
              // @ts-ignore
              backupStream.write(`${sql};${this.parseBackupFileDelimiter}\n`);
            });

            // Write data
            db.all(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`, (err, tables) => {
              if (err) {
                return reject(err);
              }

              tables.forEach((table) => {
                // @ts-ignore
                const tableName = table.name;

                db.each(
                  `SELECT * FROM ${tableName}`,
                  (err, row) => {
                    if (err) {
                      return reject(err);
                    }

                    // @ts-ignore
                    const columns = Object.keys(row).map((key) => `"${key}"`);
                    // @ts-ignore
                    const values = Object.values(row).map((value) => (value === null ? "NULL" : `'${value.toString().replace(/'/g, "''")}'`));

                    const insertStmt = `INSERT INTO "${tableName}" (${columns.join(", ")}) VALUES (${values.join(", ")});`;
                    backupStream.write(insertStmt + this.parseBackupFileDelimiter + "\n");
                  },
                  (err) => {
                    if (err) {
                      reject(err);
                    }
                  },
                );
              });

              db.close(() => {
                backupStream.write("COMMIT;\n");
                backupStream.end(() => {
                  resolve();
                });
              });
            });
          });
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  private restoreDatabaseFromFile(): Promise<void> {
    const backupDatabaseFilePath = this.databaseFilePath;

    return new Promise((resolve, reject) => {
      try {
        const db = new sqlite3.Database(backupDatabaseFilePath);
        // Read 'dump' file.
        const data = nodeFs.readFileSync(this.backupSQLFilePath, "utf-8");
        // Split the SQL statements and execute them one by one
        const sqlStatements = data.split(this.parseBackupFileDelimiter).map((s) => s.trim());

        db.serialize(() => {
          sqlStatements.forEach((statement) => {
            db.run(statement, (err) => {
              if (err) {
                return reject(`[restoreDb] Error executing statement: statement=${statement} | err=${(err as Error).message}`);
              }
            });
          });
        });

        db.close((err) => {
          if (err) {
            console.error("Database restored successfully, but we encountered an error closing database:", err);
          }
          resolve();
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  private async createDatabaseSchema(): Promise<void> {
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
            CREATE UNIQUE INDEX IF NOT EXISTS unique_userA_Id_userB_Id_pair
            ON direct_conversation (
                CASE WHEN userA_Id < userB_Id THEN userA_Id ELSE userB_Id END,
                CASE WHEN userA_Id < userB_Id THEN userB_Id ELSE userA_Id END
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
}
