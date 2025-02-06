import { DatabasePool, DirectMessagesRepository } from "@server/types";
import { DirectMessage } from "@/types.shared";
import sqlite3 from "sqlite3";
import { v7 as uuidV7 } from "uuid";

export default class DirectMessagesRepositorySQLite implements DirectMessagesRepository<sqlite3.Database> {
  databasePool: DatabasePool<sqlite3.Database>;

  constructor(dbpool: DatabasePool<sqlite3.Database>) {
    this.databasePool = dbpool;
  }

  async selectByDirectConversationId(directConversationId: string): Promise<DirectMessage[]> {
    const { db, release } = await this.databasePool.getConnection();
    return new Promise((resolve, reject) => {
      try {
        const query = `
          SELECT dm.*, u.name AS fromUserName
          FROM direct_messages dm 
          JOIN "user" u
          ON u.id = dm.fromUserId 
          WHERE dm.directConversationId = ?
          ORDER BY timestamp ASC;`;
        db.all(query, [directConversationId], (err, rows: DirectMessage[]) => {
          if (err) {
            release();
            return reject(err);
          }
          release();
          return resolve(rows);
        });
      } catch (e) {
        release();
        reject(e);
      }
    });
  }

  getAll(): Promise<DirectMessage[]> {
    throw new Error("Method not implemented.");
  }

  getById(_id: string): Promise<DirectMessage> {
    throw new Error("Method not implemented.");
  }

  async create(directConversationId: string, fromUserId: string, toUserId: string, message: string): Promise<DirectMessage> {
    const { db, release } = await this.databasePool.getConnection();
    return new Promise((resolve, reject) => {
      try {
        const query = `INSERT INTO direct_messages (id, directConversationId, fromUserId, toUserId, message, isRead, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const params = [uuidV7(), directConversationId, fromUserId, toUserId, message, true, new Date()];

        db.get(query, [params], function (err: Error | null, row: DirectMessage) {
          if (err) {
            release();
            return reject(err);
          }
          release();
          resolve(row);
        });
      } catch (e) {
        release();
        reject(e);
      }
    });
  }

  update(_id: string, _entity: DirectMessage): Promise<DirectMessage | null> {
    throw new Error("Method not implemented.");
  }

  delete(_id: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
}
