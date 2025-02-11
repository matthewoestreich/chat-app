import { PublicMessage } from "@root/types.shared";
import { DatabasePool, DirectMessagesRepository } from "@server/types";
import sqlite3 from "sqlite3";
import { v7 as uuidV7 } from "uuid";
import TABLE from "../../tables";
sqlite3.verbose();

export default class DirectMessagesRepositorySQLite implements DirectMessagesRepository<sqlite3.Database> {
  databasePool: DatabasePool<sqlite3.Database>;

  constructor(dbpool: DatabasePool<sqlite3.Database>) {
    this.databasePool = dbpool;
  }

  async selectByDirectConversationId(directConversationId: string): Promise<PublicMessage[]> {
    const { db, release } = await this.databasePool.getConnection();
    return new Promise((resolve, reject) => {
      try {
        const query = `
          SELECT dm.id, dm.directConversationId AS scopeId, dm.message, dm.timestamp, dm.fromUserId as userId, u.user_name AS userName
          FROM ${TABLE.directMessages} dm 
          JOIN ${TABLE.users} u
          ON u.id = dm.fromUserId 
          WHERE dm.directConversationId = ?
          ORDER BY timestamp ASC;`;
        db.all(query, [directConversationId], (err, rows: PublicMessage[]) => {
          release();
          if (err) {
            return reject(err);
          }
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

  async create(directConversationId: string, fromUserId: string, toUserId: string, message: string, isRead?: boolean): Promise<PublicMessage> {
    const { db, release } = await this.databasePool.getConnection();
    const directMessageId = uuidV7();

    return new Promise((resolve, reject) => {
      try {
        const [isReadQueryColumn, isReadQueryPlaceholderValue] = isRead === undefined ? ["", ""] : [", isRead", ", ?"];

        const query = `
          INSERT INTO ${TABLE.directMessages} 
            (id, directConversationId, fromUserId, toUserId, message${isReadQueryColumn}) 
          VALUES 
            (?, ?, ?, ?, ?${isReadQueryPlaceholderValue});`;

        const params: (string | boolean)[] = [directMessageId, directConversationId, fromUserId, toUserId, message];

        if (isRead !== undefined) {
          params.push(isRead);
        }

        db.run(query, params, (err: Error | null) => {
          release();
          if (err) {
            return reject(err);
          }
          const entity: PublicMessage = { id: directMessageId, userId: fromUserId, message, scopeId: directConversationId, userName: "", timestamp: new Date() };
          if (isRead !== undefined) {
            entity.isRead = isRead;
          }
          resolve(entity);
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
