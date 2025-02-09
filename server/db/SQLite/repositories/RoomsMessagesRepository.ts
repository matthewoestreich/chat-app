import { DatabasePool, RoomsMessagesRepository } from "@server/types";
import { Message, PublicMessage } from "@root/types.shared";
import sqlite3 from "sqlite3";
import { v7 as uuidV7 } from "uuid";

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
          messages.id AS id,
          messages.roomId AS scopeId,
          user.id AS userId,
          user.name AS userName,
          messages.message,
          messages.timestamp
        FROM
          messages
        JOIN 
            "user"
        ON
          messages.userId = user.id
        WHERE
          messages.roomId = ?
        ORDER BY messages.timestamp ASC;`;

        db.all(query, [roomId], (err, rows: PublicMessage[]) => {
          if (err) {
            release();
            return reject(err);
          }
          release();
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
        const query = `INSERT INTO messages (id, roomId, userId, message) VALUES (?, ?, ?, ?)`;
        const params = [messageId, roomId, userId, message];
        db.run(query, params, function (err) {
          if (err) {
            release();
            return reject(err);
          }
          release();
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
