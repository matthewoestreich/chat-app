import sqlite3 from "sqlite3";
import Mutex from "@/server/Mutex";

export default class SQLitePool implements DatabasePool<sqlite3.Database> {
  private _databasePath: string;
  private _maxConnections: number;
  private _pool: sqlite3.Database[];
  private _pendingRequests: Array<(connection: DatabasePoolConnection<sqlite3.Database>) => void>;
  private _mutex: Mutex;

  constructor(databasePath: string, maxConnections: number = 5) {
    this._databasePath = databasePath;
    this._maxConnections = maxConnections;
    this._pool = [];
    this._pendingRequests = [];
    this._mutex = new Mutex();
  }

  get databasePath(): string {
    return this._databasePath;
  }
  get maxConnections(): number {
    return this._maxConnections;
  }
  get size(): number {
    return this._pool.length;
  }
  get pendingRequests(): Array<(connection: DatabasePoolConnection<sqlite3.Database>) => void> {
    return this._pendingRequests;
  }

  getConnection(): Promise<DatabasePoolConnection<sqlite3.Database>> {
    //console.log('Attempting to get a connection...');
    return new Promise(async (resolve, reject) => {
      await this._mutex.lock();

      const db = this._pool.pop(); // Pop a connection from the pool

      if (db) {
        //console.log('Reusing an existing connection.', this);
        const connection = { db, release: () => this.releaseConnection(connection) };
        this._mutex.unlock();
        return resolve(connection);
      }

      if (this._pool.length + this.pendingRequests.length < this._maxConnections) {
        //console.log({
        //  in: "getConnection",
        //  condition: "else if (this._pool.length + this._pendingRequests.length < this._maxConnections)",
        //  action: 'Creating a new connection...',
        //  misc: `this._pool.length:${this._pool.length} + this._pendingRequests.length:${this._pendingRequests.length} = ${this._pool.length + this._pendingRequests.length}`,
        //});
        const db = new sqlite3.Database(this._databasePath, (err) => {
          if (err) {
            this._mutex.unlock();
            return reject(err);
          }
          const connection = { db, release: () => this.releaseConnection(connection) };
          this._mutex.unlock();
          return resolve(connection);
        });

        this._mutex.unlock();
        return;
      }

      console.log({
        in: "getConnection",
        condition: "else",
        action: "Pushing new request into pending requests : this._pendingRequests.push(resolve);",
      });
      this._pendingRequests.push(resolve);
      this._mutex.unlock();
    });
  }

  async releaseConnection(connection: DatabasePoolConnection<sqlite3.Database>): Promise<void> {
    console.log(" - releasing connection");
    await this._mutex.lock();

    if (this._pendingRequests.length > 0) {
      const nextRequest = this._pendingRequests.shift();
      if (nextRequest) {
        nextRequest(this.createConnectionWrapper(connection.db));
      }
    } else {
      this._pool.push(connection.db);
    }

    this._mutex.unlock();
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

  async closeAll() {
    return new Promise<void>(async (resolve, reject) => {
      await this._mutex.lock();

      let closeCount = 0;
      const totalConnections = this._pool.length;

      if (totalConnections === 0) {
        return resolve();
      }

      for (const connection of this._pool) {
        connection.close((err) => {
          if (err) {
            return reject(err);
          }
          closeCount++;
          if (closeCount === totalConnections) {
            this._pool.length = 0; // Clear the pool
            return resolve();
          }
        });
      }

      this._mutex.unlock();
    });
  }

  private createConnectionWrapper(db: sqlite3.Database): DatabasePoolConnection<sqlite3.Database> {
    return {
      db,
      release: () => this.releaseConnection({ db, release: () => undefined }),
    };
  }
}
