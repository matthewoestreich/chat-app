import { v7 as uuidV7 } from "uuid";
import sqlite3 from "sqlite3";
import bcrypt from "bcrypt";
import { User } from "@root/types.shared";
import { AccountsRepository, DatabasePool } from "@server/types";
import tableNames from "../../tableNames";

export default class AccountsRepositorySQLite implements AccountsRepository<sqlite3.Database> {
  private TABLE_NAME = tableNames.users;
  databasePool: DatabasePool<sqlite3.Database>;

  constructor(dbpool: DatabasePool<sqlite3.Database>) {
    this.databasePool = dbpool;
  }

  async selectByEmail(email: string): Promise<User> {
    const { db, release } = await this.databasePool.getConnection();
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM ${this.TABLE_NAME} WHERE email = ?`, [email], (err, row) => {
        release();
        if (err) {
          return reject(err);
        }
        return resolve(row as User);
      });
    });
  }

  getAll(): Promise<User[]> {
    throw new Error("Method not implemented.");
  }

  async getById(id: string): Promise<User> {
    const { db, release } = await this.databasePool.getConnection();
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM ${this.TABLE_NAME} WHERE id = ?`, [id], (err, row) => {
        release();
        if (err) {
          return reject(err);
        }
        return resolve(row as User);
      });
    });
  }

  async create(name: string, passwd: string, email: string): Promise<User> {
    const { db, release } = await this.databasePool.getConnection();
    return new Promise(async (resolve, reject) => {
      try {
        const salt = await bcrypt.genSalt(10);
        const hashedPw = await bcrypt.hash(passwd, salt);
        const entity: User = { id: uuidV7(), userName: name, password: hashedPw, email };

        const query = `INSERT INTO ${this.TABLE_NAME} (id, user_name, password, email) VALUES (?, ?, ?, ?)`;
        db.run(query, [entity.id, entity.userName, hashedPw, entity.email], (err) => {
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

  update(_id: string, _entity: User): Promise<User | null> {
    throw new Error("Method not implemented.");
  }

  delete(_id: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
}
