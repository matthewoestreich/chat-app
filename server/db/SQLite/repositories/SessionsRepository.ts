import { DatabasePool, SessionsRepository } from "@server/types";
import { Session } from "@root/types.shared";
import sqlite3 from "sqlite3";
import TABLE from "../../tables";

export default class SessionsRepositorySQLite implements SessionsRepository<sqlite3.Database> {
  databasePool: DatabasePool<sqlite3.Database>;

  constructor(dbpool: DatabasePool<sqlite3.Database>) {
    this.databasePool = dbpool;
  }

  async selectByUserId(userId: string): Promise<Session | undefined> {
    const { db, release } = await this.databasePool.getConnection();
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM ${TABLE.sessions} WHERE userId = ?`, [userId], (err, row: Session) => {
        release();
        if (err) {
          return reject(err);
        }
        return resolve(row);
      });
    });
  }

  async upsert(userId: string, token: string): Promise<boolean> {
    const { db, release } = await this.databasePool.getConnection();
    const entity: Session = { userId, token };
    return new Promise(async (resolve, reject) => {
      try {
        const query = `INSERT INTO ${TABLE.sessions} (userId, token) VALUES (?, ?) ON CONFLICT(userId) DO UPDATE SET token = excluded.token;`;
        db.run(query, [entity.userId, entity.token], function (err) {
          release();
          if (err) {
            return reject(err);
          }
          return resolve(true);
        });
      } catch (e) {
        release();
        return reject(e);
      }
    });
  }

  async deleteByUserId(userId: string): Promise<boolean> {
    const { db, release } = await this.databasePool.getConnection();
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run(`DELETE FROM ${TABLE.sessions} WHERE userId = ?`, userId, function (err) {
          release();
          if (err) {
            return reject(err);
          }
          if (this.changes !== 1) {
            return reject(new Error("unable to remove refresh token!"));
          }
          release();
          return resolve(true);
        });
      });
    });
  }

  getAll(): Promise<Session[]> {
    throw new Error("Method not implemented.");
  }

  getById(_id: string): Promise<Session> {
    throw new Error("Method not implemented.");
  }

  async create(userId: string, sessionToken: string): Promise<Session> {
    const { db, release } = await this.databasePool.getConnection();
    const entity: Session = { userId, token: sessionToken };

    return new Promise(async (resolve, reject) => {
      try {
        const query = `INSERT INTO ${TABLE.sessions} (userId, token) VALUES (?, ?)`;
        db.run(query, [entity.userId, entity.token], (err) => {
          release();
          if (err) {
            return reject(err);
          }
          return resolve(entity);
        });
      } catch (e) {
        release();
        return reject(e);
      }
    });
  }

  update(_id: string, _entity: Session): Promise<Session | null> {
    throw new Error("Method not implemented.");
  }

  async delete(token: string): Promise<boolean> {
    const { db, release } = await this.databasePool.getConnection();
    return new Promise((resolve, reject) => {
      try {
        db.serialize(() => {
          db.run(`DELETE FROM ${TABLE.sessions} WHERE token = ?`, token, function (err) {
            release();
            if (err) {
              return reject(err);
            }
            return resolve(true);
          });
        });
      } catch (e) {
        release();
        reject(e);
      }
    });
  }
}
