import sqlite3 from "sqlite3";
sqlite3.verbose();

export default class SQLitePool implements DatabasePool<sqlite3.Database> {
  databasePath: string;
  maxConnections: number;
  pool: sqlite3.Database[];
  pendingRequests: DatabasePoolPendingRequest<sqlite3.Database>[];

  constructor(dbPath: string, maxConnections: number = 5) {
    this.databasePath = dbPath;
    this.maxConnections = maxConnections;
    this.pool = [];
    this.pendingRequests = [];
  }

  getConnection(): Promise<sqlite3.Database> {
    return new Promise((resolve, reject) => {
      if (this.pool.length > 0) {
        const db = this.pool.pop();
        if (db) resolve(db);
      } else if (this.pool.length + this.pendingRequests.length < this.maxConnections) {
        const db = new sqlite3.Database(this.databasePath, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(db);
          }
        });
      } else {
        this.pendingRequests.push({ resolve, reject });
      }
    });
  }

  releaseConnection(db: sqlite3.Database) {
    if (this.pendingRequests.length > 0) {
      const request = this.pendingRequests.shift();
      request?.resolve(db);
    } else {
      this.pool.push(db);
    }
  }

  async query(sql: string, params: any) {
    const db = await this.getConnection();
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        this.releaseConnection(db);
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}
