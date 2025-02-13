import { DatabasePool, RoomsMessagesRepository } from "@server/types";
import { Message, PublicMessage } from "@root/types.shared";
import sqlite3 from "sqlite3";
import { v7 as uuidV7 } from "uuid";
import TABLE from "../../tables";

export default class RoomsMessagesRepositorySQLite implements RoomsMessagesRepository<sqlite3.Database> {
  databasePool: DatabasePool<sqlite3.Database>;

  constructor(dbpool: DatabasePool<sqlite3.Database>) {
    this.databasePool = dbpool;
  }

  async selectByRoomId(roomId: string): Promise<PublicMessage[]> {
    const { db, release } = await this.databasePool.getConnection();
    return new Promise((resolve, reject) => {
      try {
        const query = `
        SELECT
          m.id AS id,
          m.roomId AS scopeId,
          u.id AS userId,
          u.user_name AS userName,
          m.message,
          m.timestamp
        FROM
          ${TABLE.roomMessages} m
        JOIN 
            ${TABLE.users} u
        ON
          m.userId = u.id
        WHERE
          m.roomId = ?
        ORDER BY m.timestamp ASC;`;

        db.all(query, [roomId], (err, rows: PublicMessage[]) => {
          release();
          if (err) {
            return reject(err);
          }
          return resolve(rows);
        });
      } catch (e) {
        release();
        return reject(e);
      }
    });
  }

  getAll(): Promise<Message[]> {
    throw new Error("Method not implemented.");
  }

  async getById(id: string): Promise<Message> {
    const { db, release } = await this.databasePool.getConnection();
    return new Promise((resolve, reject) => {
      try {
        db.get(`SELECT * FROM ${TABLE.roomMessages} rm WHERE rm.id = ?`, [id], function (err: Error | null, row: Message) {
          release();
          if (err) {
            return reject(err);
          }
          resolve(row);
        });
      } catch (e) {
        release();
        reject(e);
      }
    });
  }

  /**
   *
   * FYI LET THE DB HANDLE INSERTING THE TIMESTAMP!
   *
   * @param roomId
   * @param userId
   * @param message
   * @returns
   */
  async create(roomId: string, userId: string, message: string): Promise<Message> {
    const { db, release } = await this.databasePool.getConnection();
    return new Promise((resolve, reject) => {
      try {
        const messageId = uuidV7();
        // FYI LET THE DB HANDLE INSERTING THE TIMESTAMP!
        const query = `INSERT INTO ${TABLE.roomMessages} (id, roomId, userId, message) VALUES (?, ?, ?, ?)`;
        const params = [messageId, roomId, userId, message];
        db.run(query, params, async (err: Error | null) => {
          release();
          if (err) {
            return reject(err);
          }
          try {
            const newMessage = await this.getById(messageId);
            newMessage.scopeId = roomId;
            resolve(newMessage);
          } catch (_e) {
            resolve({ id: messageId, userId, scopeId: roomId, message, timestamp: new Date() });
          }
        });
      } catch (e) {
        release();
        return reject(e);
      }
    });
  }

  update(_id: string, _entity: Message): Promise<Message | null> {
    throw new Error("Method not implemented.");
  }

  delete(_id: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
}
