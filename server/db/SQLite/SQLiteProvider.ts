import nodeFs from "node:fs";
import nodePath from "node:path";
import sqlite3 from "sqlite3";
import { DatabasePool, DatabaseProvider, RoomsRepository, RoomsMessagesRepository, AccountsRepository, DirectConversationsRepository, DirectMessagesRepository, SessionsRepository } from "@server/types";
import WebSocketApp from "@server/wss/WebSocketApp";
import { generateFakeData } from "@server/fakerService";
import { getGistFiles, updateGist } from "@server/gistService";
import { ZipWriteStream, unzipFile } from "@server/zipService";
import SQLitePool from "./pool/SQLitePool";
import { insertFakeData } from "./insertFakeData";
import tableNames from "../tables";
import { AccountsRepositorySQLite, DirectConversationsRepositorySQLite, DirectMessagesRepositorySQLite, RoomsMessagesRepositorySQLite, RoomsRepositorySQLite, SessionsRepositorySQLite } from "./repositories/index";
sqlite3.verbose();

export default class SQLiteProvider implements DatabaseProvider<sqlite3.Database> {
  private parseBackupFileDelimiter: string = "~~__~~";
  private backupSQLFilePath: string;
  private databaseFilePath: string;

  private BACKUP_ZIP_FILE: string;
  private BACKUP_B64_FILE: string;

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
    this.BACKUP_ZIP_FILE = this.backupSQLFilePath + ".zip";
    this.BACKUP_B64_FILE = this.backupSQLFilePath + ".zip.b64";

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
        // If the general room doesn't exist, it means we need to seed..
        db.get(`SELECT * FROM ${tableNames.rooms} WHERE id = ?`, [WebSocketApp.ID_UNASSIGNED], async (err, row) => {
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
            lowerCaseUserName: true,
          },
          chatRoomsParams: {
            numberOfRooms: 50,
            longNameFrequency: 5,
            lowerCase: true,
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
    return new Promise(async (resolve, reject) => {
      if (!process.env.GH_GISTS_API_KEY) {
        return reject(new Error("[SQLiteProvider.backup()] gists api key not found (via process.env.GH_GISTS_API_KEY)."));
      }
      if (!process.env.GIST_ID) {
        return reject(new Error("[SQLiteProvider.backup()] gist id not found (via process.env.GIST_ID)."));
      }

      try {
        // Backup to .zip file
        await this.backupDatabaseToZipFile(this.BACKUP_ZIP_FILE);
        // Read zip contents and encode as base64. This prevents corruption when uploading binary files to gists.
        nodeFs.writeFileSync(this.BACKUP_B64_FILE, nodeFs.readFileSync(this.BACKUP_ZIP_FILE).toString("base64"));
        // Upload our base64 encoded zip file to gists.
        await updateGist(process.env.GH_GISTS_API_KEY, process.env.GIST_ID, [this.BACKUP_B64_FILE]);
        nodeFs.unlinkSync(this.BACKUP_ZIP_FILE);
        nodeFs.unlinkSync(this.BACKUP_B64_FILE);
        resolve();
      } catch (e) {
        if (nodeFs.existsSync(this.BACKUP_ZIP_FILE)) {
          nodeFs.unlinkSync(this.BACKUP_ZIP_FILE);
        }
        if (nodeFs.existsSync(this.BACKUP_B64_FILE)) {
          nodeFs.unlinkSync(this.BACKUP_B64_FILE);
        }
        reject(e);
      }
    });
  }

  async restore(): Promise<void> {
    const backupSQLFileName = nodePath.basename(this.BACKUP_B64_FILE);

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

        // Decode base64 encoded zip file content
        const zipBuffer = Buffer.from(file.content, "base64");
        // Write zipped content to .zip file
        nodeFs.writeFileSync(this.BACKUP_ZIP_FILE, zipBuffer);
        // Unzip zipped file to our original .sql file
        unzipFile(this.BACKUP_ZIP_FILE, this.backupSQLFilePath);
        // Remove the .zip file
        nodeFs.unlinkSync(this.BACKUP_ZIP_FILE);
        // Continue with restore
        await this.restoreDatabaseFromFile(this.backupSQLFilePath);
        nodeFs.unlinkSync(this.backupSQLFilePath);
        resolve();
      } catch (e) {
        if (nodeFs.existsSync(this.backupSQLFilePath)) {
          nodeFs.unlinkSync(this.backupSQLFilePath);
        }
        if (nodeFs.existsSync(this.BACKUP_ZIP_FILE)) {
          nodeFs.unlinkSync(this.BACKUP_ZIP_FILE);
        }
        reject(e);
      }
    });
  }

  private backupDatabaseToZipFile(backupOutputFilePath: string): Promise<void> {
    const backupDatabaseFilePath = this.databaseFilePath;

    return new Promise((resolve, reject) => {
      try {
        if (!nodeFs.existsSync(backupDatabaseFilePath)) {
          return reject(new Error(`No database found at dbPath: '${backupDatabaseFilePath}'`));
        }

        const db = new sqlite3.Database(backupDatabaseFilePath, sqlite3.OPEN_READONLY);
        const backupStream = new ZipWriteStream(backupOutputFilePath);

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
              gzip.write(`${sql};${this.parseBackupFileDelimiter}\n`);
            });

            // Write data
            db.all(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`, (err, TABLE) => {
              if (err) {
                return reject(err);
              }

              TABLE.forEach((table) => {
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

              db.close(async () => {
                backupStream.write("COMMIT;\n");
                await backupStream.end();
                resolve();
              });
            });
          });
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  private restoreDatabaseFromFile(filePathOfBackupToRestore: string): Promise<void> {
    const backupDatabaseFilePath = this.databaseFilePath;

    return new Promise((resolve, reject) => {
      try {
        const db = new sqlite3.Database(backupDatabaseFilePath);
        const data = nodeFs.readFileSync(filePathOfBackupToRestore, "utf-8");
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
            CREATE TABLE IF NOT EXISTS ${tableNames.users} (
              id TEXT PRIMARY KEY,
              user_name TEXT NOT NULL, 
              password TEXT NOT NULL,
              email TEXT NOT NULL UNIQUE,
              first_name TEXT,
              last_name TEXT,
              CHECK(length(id) = 36)
            );`);
          db.run(`
            CREATE TABLE IF NOT EXISTS ${tableNames.rooms} (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              isPrivate BOOLEAN NOT NULL CHECK (isPrivate IN (0, 1)),
              CHECK(length(id) = 36)
            );`);
          db.run(`
            CREATE TABLE IF NOT EXISTS ${tableNames.roomMemberships} (
              roomId TEXT NOT NULL,
              userId TEXT NOT NULL,
              PRIMARY KEY (userId, roomId),
              CONSTRAINT chat_room_FK FOREIGN KEY (roomId) REFERENCES ${tableNames.rooms}(id),
              CONSTRAINT chat_user_FK FOREIGN KEY (userId) REFERENCES ${tableNames.users}(id),
              CHECK(length(roomId) = 36 AND length(userId) = 36)
            );`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_room_memberships_roomId ON ${tableNames.roomMemberships} (roomId);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_room_memberships_userId ON ${tableNames.roomMemberships} (userId);`);
          db.run(`
            CREATE TABLE IF NOT EXISTS ${tableNames.sessions} (
              userId TEXT PRIMARY KEY,
              token TEXT NOT NULL,
              CONSTRAINT session_user_FK FOREIGN KEY (userId) REFERENCES ${tableNames.users}(id),
              CHECK(length(userId) = 36)
            );`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_sessions_token ON ${tableNames.sessions} (token);`);
          db.run(`
            CREATE TABLE IF NOT EXISTS ${tableNames.roomMessages} (
              id TEXT PRIMARY KEY,
              roomId TEXT NOT NULL,
              userId TEXT NOT NULL,
              message TEXT NOT NULL,
              timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            );`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_roomId_timestamp ON ${tableNames.roomMessages} (roomId, timestamp);`);
          db.run(` -- Trigger to only store 50 messages per room.
            CREATE TRIGGER IF NOT EXISTS enforce_room_messages_message_limit 
            AFTER INSERT ON ${tableNames.roomMessages} 
            WHEN (SELECT COUNT(*) FROM ${tableNames.roomMessages} WHERE roomId = NEW.roomId) > 50 
            BEGIN
              DELETE FROM ${tableNames.roomMessages}
              WHERE id = (
                SELECT id
                FROM ${tableNames.roomMessages}
                WHERE roomId = NEW.roomId
                ORDER BY timestamp ASC
                LIMIT 1
              );
            END;`);
          db.run(`
            CREATE TABLE IF NOT EXISTS ${tableNames.directConversations} (
              id TEXT PRIMARY KEY,
              userAId TEXT NOT NULL,
              userBId TEXT NOT NULL --,
              --UNIQUE (userAId, userBId)
            );`);
          db.run(`
            CREATE UNIQUE INDEX IF NOT EXISTS unique_user_pair
            ON ${tableNames.directConversations} (
              CASE WHEN userAId < userBId THEN userAId ELSE userBId END,
              CASE WHEN userAId < userBId THEN userBId ELSE userAId END
            );`);
          db.run(`
            CREATE TABLE IF NOT EXISTS ${tableNames.directConversationMemberships} (
              id TEXT PRIMARY KEY,
              directConversationId TEXT NOT NULL,
              userId TEXT NOT NULL,
              isMember BOOLEAN DEFAULT 1 CHECK (isMember IN (0, 1)),
              joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
              leftAt DATETIME,
              FOREIGN KEY (directConversationId) REFERENCES ${tableNames.directConversations} (id),
              UNIQUE (directConversationId, userId)
            );`);
          db.run(`
            CREATE TABLE IF NOT EXISTS ${tableNames.directMessages} (
              id TEXT PRIMARY KEY,
              directConversationId TEXT NOT NULL,
              fromUserId TEXT NOT NULL,
              toUserId TEXT NOT NULL,
              message TEXT NOT NULL,
              isRead BOOLEAN NOT NULL DEFAULT 0,
              timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (directConversationId) REFERENCES ${tableNames.directConversations}(id),
              FOREIGN KEY (fromUserId) REFERENCES ${tableNames.users}(id),
              FOREIGN KEY (toUserId) REFERENCES ${tableNames.users}(id),
              CHECK (fromUserId <> toUserId) -- Ensure a user cannot send messages to themselves
            );`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_directConversationId_timestamp ON ${tableNames.directMessages} (directConversationId, timestamp);`);
          db.run(` -- Trigger to only store 50 messages per DM.
            CREATE TRIGGER IF NOT EXISTS enforce_direct_messages_message_limit 
            AFTER INSERT ON ${tableNames.directMessages} 
            WHEN (SELECT COUNT(*) FROM ${tableNames.directMessages} WHERE directConversationId = NEW.directConversationId) > 50 
            BEGIN 
              DELETE FROM ${tableNames.directMessages} WHERE id = (
                SELECT id
                FROM ${tableNames.directMessages}
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
