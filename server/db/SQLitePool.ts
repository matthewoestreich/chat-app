import sqlite3 from "sqlite3";

export default class SQLitePool implements DatabasePool<sqlite3.Database> {
  private databasePath: string;
  private maxConnections: number;
  private pool: sqlite3.Database[];
  private pendingRequests: Array<(connection: DatabasePoolConnection<sqlite3.Database>) => void>;

  constructor(databasePath: string, maxConnections: number = 5) {
    this.databasePath = databasePath;
    this.maxConnections = maxConnections;
    this.pool = [];
    this.pendingRequests = [];
  }

  async getConnection(): Promise<DatabasePoolConnection<sqlite3.Database>> {
    return new Promise((resolve, reject) => {
      const existingConnection = this.pool.pop();
      if (existingConnection) {
        return resolve(this.createConnectionWrapper(existingConnection));
      }

      if (this.pool.length + this.pendingRequests.length < this.maxConnections) {
        const db = new sqlite3.Database(this.databasePath, (err) => {
          if (err) {
            return reject(err);
          }
          resolve(this.createConnectionWrapper(db));
        });
      } else {
        this.pendingRequests.push(resolve);
      }
    });
  }

  releaseConnection(connection: DatabasePoolConnection<sqlite3.Database>): void {
    if (this.pendingRequests.length > 0) {
      const nextRequest = this.pendingRequests.shift();
      if (nextRequest) {
        nextRequest(this.createConnectionWrapper(connection.db));
      }
    } else {
      this.pool.push(connection.db);
    }
  }

  async query(sql: string, params: any): Promise<unknown> {
    const connection = await this.getConnection();
    return new Promise((resolve, reject) => {
      connection.db.all(sql, params, (err, rows) => {
        connection.release(); // Release the connection back to the pool
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });
  }

  /**
   * Closes all connections in the pool.
   */
  async closeAll(): Promise<void> {
    return new Promise((resolve, reject) => {
      let closedCount = 0;
      const totalConnections = this.pool.length;

      if (totalConnections === 0) {
        resolve();
        return;
      }

      for (const connection of this.pool) {
        connection.close((err) => {
          if (err) {
            return reject(err);
          }
          closedCount++;
          if (closedCount === totalConnections) {
            resolve();
          }
        });
      }
    });
  }
  private createConnectionWrapper(db: sqlite3.Database): DatabasePoolConnection<sqlite3.Database> {
    return {
      db,
      release: () => this.releaseConnection({ db, release: () => undefined }),
    };
  }
}
