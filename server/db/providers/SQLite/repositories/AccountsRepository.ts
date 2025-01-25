import sqlite3 from "sqlite3";
import bcrypt from "bcrypt";

export default class AccountsRepositorySQLite implements AccountsRepository<sqlite3.Database> {
  databasePool: DatabasePool<sqlite3.Database>;

  constructor(dbpool: DatabasePool<sqlite3.Database>) {
    this.databasePool = dbpool;
  }

  async selectByEmail(email: string): Promise<Account> {
    const { db, release } = await this.databasePool.getConnection();
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM "user" WHERE email = ?`, [email], (err, row) => {
        if (err) {
          release();
          return reject(err);
        }
        release();
        return resolve(row as Account);
      });
    });
  }

  getAll(): Promise<Account[]> {
    throw new Error("Method not implemented.");
  }

  async getById(id: string): Promise<Account> {
    const { db, release } = await this.databasePool.getConnection();
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM "user" WHERE id = ?`, [id], (err, row) => {
        if (err) {
          release();
          return reject(err);
        }
        release();
        return resolve(row as Account);
      });
    });
  }

  async create(entity: Account): Promise<Account> {
    const { db, release } = await this.databasePool.getConnection();
    return new Promise(async (resolve, reject) => {
      try {
        if (!entity.password) {
          throw new Error("missing password");
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPw = await bcrypt.hash(entity.password, salt);
        const query = `INSERT INTO "user" (id, name, password, email) VALUES (?, ?, ?, ?)`;

        db.run(query, [entity.id, entity.name, hashedPw, entity.email], (err) => {
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

  update(_id: string, _entity: Account): Promise<Account | null> {
    throw new Error("Method not implemented.");
  }

  delete(_id: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
}
