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

  getConnection(): Promise<DatabasePoolConnection<sqlite3.Database>> {
    return new Promise((resolve, reject) => {
      const db = this.pool.pop();
      if (db) {
        const dbc = { db, release: () => this.releaseConnection(dbc) };
        return resolve(dbc);
      }
      if (this.pool.length + this.pendingRequests.length < this.maxConnections) {
        const db = new sqlite3.Database(this.databasePath, (err) => {
          if (err) {
            return reject(err);
          }
          const con = { db, release: () => this.releaseConnection(con) };
          return resolve(con);
        });
      }
      // Type '(value: DatabasePoolConnection | PromiseLike<DatabasePoolConnection>) => void'
      // is not assignable to type '(value: Database | PromiseLike<Database>) => void'.
      return this.pendingRequests.push({ resolve, reject });
    });
  }

  /*
        return this.pendingRequests.push({
        resolve: (value: sqlite3.Database | PromiseLike<sqlite3.Database>) => {},
        reject,
      });
      */

  releaseConnection(connection: DatabasePoolConnection<sqlite3.Database>) {
    if (this.pendingRequests.length > 0) {
      const request = this.pendingRequests.shift();
      request?.resolve(connection.db);
    } else {
      this.pool.push(connection.db);
    }
  }

  async query(sql: string, params: any) {
    const databasepoolConnection = await this.getConnection();
    const connection = databasepoolConnection;
    return new Promise((resolve, reject) => {
      connection.db.all(sql, params, (err: any, rows: unknown) => {
        this.releaseConnection(connection);
        if (err) {
          return reject(err);
        }
        return resolve(rows);
      });
    });
  }
}
