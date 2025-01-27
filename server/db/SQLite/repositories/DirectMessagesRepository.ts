import sqlite3 from "sqlite3";

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

  create(_entity: DirectMessage): Promise<DirectMessage> {
    throw new Error("Method not implemented.");
  }

  update(_id: string, _entity: DirectMessage): Promise<DirectMessage | null> {
    throw new Error("Method not implemented.");
  }

  delete(_id: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
}
