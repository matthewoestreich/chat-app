import sqlite3 from "sqlite3";

export default class DirectConversationsRepositorySQLite implements DirectConversationsRepository<sqlite3.Database> {
  databasePool: DatabasePool<sqlite3.Database>;

  constructor(dbpool: DatabasePool<sqlite3.Database>) {
    this.databasePool = dbpool;
  }

  async selectByUserId(userId: string): Promise<DirectConversation[]> {
    const { db, release } = await this.databasePool.getConnection();
    return new Promise((resolve, reject) => {
      const query = `
      SELECT dc.id AS id, u.id AS userId, u.name AS userName
      FROM direct_conversation dc
      JOIN "user" u 
      ON u.id = CASE WHEN dc.userA_Id = ? THEN dc.userB_Id ELSE dc.userA_Id END
      WHERE ? IN (dc.userA_Id, dc.userB_Id)
      ORDER BY userName ASC;
      `;
      db.all(query, [userId, userId], (err, rows: DirectConversation[]) => {
        if (err) {
          release();
          return reject(err);
        }
        release();
        return resolve(rows);
      });
    });
  }

  async selectInvitableUsersByUserId(userId: string): Promise<Account[]> {
    const { db, release } = await this.databasePool.getConnection();
    return new Promise((resolve, reject) => {
      const query = `
      SELECT u.id, u.name FROM "user" u WHERE u.id != ?
      AND u.id NOT IN (
          SELECT userA_Id FROM direct_conversation WHERE userB_Id = ?
          UNION
          SELECT userB_Id FROM direct_conversation WHERE userA_Id = ?
      );
      `;
      db.all(query, [userId, userId, userId], (err, rows: Account[]) => {
        if (err) {
          release();
          return reject(err);
        }
        release();
        return resolve(rows);
      });
    });
  }

  getAll(): Promise<DirectConversation[]> {
    throw new Error("Method not implemented.");
  }

  getById(_id: string): Promise<DirectConversation> {
    throw new Error("Method not implemented.");
  }

  async create(entity: DirectConversation): Promise<DirectConversation> {
    const { db, release } = await this.databasePool.getConnection();
    return new Promise((resolve, reject) => {
      try {
        const query = `INSERT INTO direct_conversation (id, userA_id, userB_id) VALUES (?, ?, ?)`;
        db.run(query, [entity.id, entity.userA_id, entity.userB_id], async (err) => {
          if (err) {
            release();
            return reject(err);
          }
          release();
          return resolve(entity);
        });
      } catch (e) {
        release();
        return reject(e);
      }
    });
  }

  update(_id: string, _entity: DirectConversation): Promise<DirectConversation | null> {
    throw new Error("Method not implemented.");
  }

  delete(_id: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
}
