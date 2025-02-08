import { PublicMessage } from "@root/types.shared";
import { DatabasePool, DirectMessagesRepository } from "@server/types";
import sqlite3 from "sqlite3";
import { v7 as uuidV7 } from "uuid";

export default class DirectMessagesRepositorySQLite implements DirectMessagesRepository<sqlite3.Database> {
  databasePool: DatabasePool<sqlite3.Database>;

  constructor(dbpool: DatabasePool<sqlite3.Database>) {
    this.databasePool = dbpool;
  }
  /*
  id: string;
  userId: string;
  scopeId: string; // roomId/directConvoId,etc..
  message: string;
  timestamp: Date;
  */
  async selectByDirectConversationId(directConversationId: string): Promise<PublicMessage[]> {
    const { db, release } = await this.databasePool.getConnection();
    return new Promise((resolve, reject) => {
      try {
        const query = `
          SELECT dm.id, dm.directConversationId AS scopeId, dm.message, dm.timestamp, dm.fromUserId as userId, u.name AS userName
          FROM direct_messages dm 
          JOIN "user" u
          ON u.id = dm.fromUserId 
          WHERE dm.directConversationId = ?
          ORDER BY timestamp ASC;`;
        db.all(query, [directConversationId], (err, rows: PublicMessage[]) => {
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

  getAll(): Promise<PublicMessage[]> {
    throw new Error("Method not implemented.");
  }

  getById(_id: string): Promise<PublicMessage> {
    throw new Error("Method not implemented.");
  }

  async create(directConversationId: string, fromUserId: string, toUserId: string, message: string): Promise<PublicMessage> {
    const { db, release } = await this.databasePool.getConnection();
    return new Promise((resolve, reject) => {
      try {
        const query = `INSERT INTO direct_messages (id, directConversationId, fromUserId, toUserId, message, isRead, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const params = [uuidV7(), directConversationId, fromUserId, toUserId, message, true, new Date()];

        db.get(query, [params], function (err: Error | null, row: PublicMessage) {
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

  update(_id: string, _entity: PublicMessage): Promise<PublicMessage | null> {
    throw new Error("Method not implemented.");
  }

  delete(_id: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
}
