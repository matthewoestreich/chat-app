import { DatabasePool, RoomsMessagesRepository } from "@server/types";
import { Message, PublicMessage } from "@root/types.shared";
import sqlite3 from "sqlite3";
import { v7 as uuidV7 } from "uuid";
import tableNames from "../../tableNames";

export default class RoomsMessagesRepositorySQLite implements RoomsMessagesRepository<sqlite3.Database> {
  private TABLE_NAME = tableNames.roomMessages;
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
          ${this.TABLE_NAME} m
        JOIN 
            ${tableNames.users} u
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
  getById(_id: string): Promise<Message> {
    throw new Error("Method not implemented.");
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
        const query = `INSERT INTO ${this.TABLE_NAME} (id, roomId, userId, message) VALUES (?, ?, ?, ?)`;
        const params = [messageId, roomId, userId, message];
        db.run(query, params, function (err) {
          release();
          if (err) {
            return reject(err);
          }
          // FYI LET THE DB HANDLE INSERTING THE TIMESTAMP!
          return resolve({ id: messageId, userId, scopeId: roomId, message, timestamp: new Date() });
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
