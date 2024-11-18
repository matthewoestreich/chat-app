import sqlite3 from "sqlite3";
import Mutex from "@/server/Mutex";
sqlite3.verbose();

export default class SQLitePool implements DatabasePool<sqlite3.Database> {
  private _pool: sqlite3.Database[];
  private _activeConnections = 0;
  private _mutex = new Mutex();

  private _databasePath: string;
  get databasePath(): string {
    return this._databasePath;
  }

  private _maxConnections: number;
  get maxConnections(): number {
    return this._maxConnections;
  }

  private _pendingRequests: Array<(connection: DatabasePoolConnection<sqlite3.Database>) => void>;
  get pendingRequestsSize(): Promise<number> {
    return new Promise(async (resolve) => {
      await this._mutex.lock();
      const s = this._pendingRequests.length;
      this._mutex.unlock();
      resolve(s);
    });
  }

  constructor(databasePath: string, maxConnections: number = 5) {
    this._databasePath = databasePath;
    this._maxConnections = maxConnections;
    this._pool = [];
    this._pendingRequests = [];
  }

  get size(): Promise<number> {
    return new Promise(async (resolve) => {
      await this._mutex.lock();
      const s = this._pool.length;
      this._mutex.unlock();
      resolve(s);
    });
  }

  getConnection(): Promise<DatabasePoolConnection<sqlite3.Database>> {
    return new Promise(async (resolve, reject) => {
      await this._mutex.lock();
      const db = this._pool.pop(); // Pop a connection from the pool
      if (db) {
        const connection = { db, release: () => this.releaseConnection(connection) };
        this._mutex.unlock();
        return resolve(connection);
      }

      if (this._activeConnections < this._maxConnections) {
        const db = new sqlite3.Database(this._databasePath, (err) => {
          if (err) {
            this._mutex.unlock();
            return reject(err);
          }
          const connection = { db, release: () => this.releaseConnection(connection) };
          this._activeConnections++;
          this._mutex.unlock();
          return resolve(connection);
        });
        this._mutex.unlock();
        return;
      }

      this._pendingRequests.push(resolve);
      this._mutex.unlock();
    });
  }

  async releaseConnection(connection: DatabasePoolConnection<sqlite3.Database>): Promise<void> {
    await this._mutex.lock();
    if (this._pendingRequests.length > 0) {
      const nextRequest = this._pendingRequests.shift();
      if (nextRequest) {
        nextRequest(this._createSQLiteDatabaseConnection(connection.db));
      }
      this._mutex.unlock();
    } else {
      this._pool.push(connection.db);
      this._mutex.unlock();
    }
  }

  async query(sql: string, params: any): Promise<unknown> {
    const connection = await this.getConnection();
    return new Promise((resolve, reject) => {
      connection.db.all(sql, params, async (err, rows) => {
        connection.release(); // Release the connection back to the pool
        if (err) {
          return reject(err);
        }
        return resolve(rows);
      });
    });
  }

  async closeAll() {
    return new Promise<void>(async (resolve, reject) => {
      let closeCount = 0;
      const totalConnections = this._pool.length;
      if (totalConnections === 0) {
        return resolve();
      }

      await this._mutex.lock();
      for (const connection of this._pool) {
        connection.close((err) => {
          if (err) {
            this._mutex.unlock();
            return reject(err);
          }
          closeCount++;
          if (closeCount === totalConnections) {
            this._pool.length = 0; // Clear the pool
            this._mutex.unlock();
            return resolve();
          }
        });
      }

      this._mutex.unlock();
    });
  }

  private _createSQLiteDatabaseConnection(db: sqlite3.Database): DatabasePoolConnection<sqlite3.Database> {
    return { db, release: () => this.releaseConnection({ db, release: () => undefined }) };
  }
}

/*
export default class SQLitePool implements DatabasePool<sqlite3.Database> {
  private _databasePath: string;
  get databasePath(): string {
    return this._databasePath;
  }

  private _maxConnections: number;
  get maxConnections(): number {
    return this._maxConnections;
  }

  private _pool: sqlite3.Database[];
  get size(): number {
    return this._pool.length;
  }

  private _pendingRequests: Array<(connection: DatabasePoolConnection<sqlite3.Database>) => void>;
  get pendingRequests(): Array<(connection: DatabasePoolConnection<sqlite3.Database>) => void> {
    return this._pendingRequests;
  }

  private _activeConnections = 0;
  private _mutex = new Mutex();

  constructor(databasePath: string, maxConnections: number = 5) {
    this._databasePath = databasePath;
    this._maxConnections = maxConnections;
    this._pool = [];
    this._pendingRequests = [];
  }

  async getConnection(): Promise<DatabasePoolConnection<sqlite3.Database>> {
    return new Promise(async (resolve, reject) => {
      await this._mutex.lock();
      const db = this._pool.pop();
      if (db) {
        this._mutex.this._mutex.unlock();
        return this._createNewDatabasePoolConnection(db);
      }
      if (this._activeConnections < this._maxConnections) {
        this._activeConnections++;
        const db = await this._createNewSQLiteConnection();
        this._mutex.this._mutex.unlock();
        return this._createNewDatabasePoolConnection(db);
      }
      this._pendingRequests.push(resolve);
      this._mutex.this._mutex.unlock();
    });
  }

  releaseConnection(connection: DatabasePoolConnection<sqlite3.Database>): void {
    if (this._pendingRequests.length > 0) {
      const resolve = this._pendingRequests.shift();
      if (resolve) {
        resolve(this._createNewDatabasePoolConnection(connection.db));
      }
    } else {
      this._pool.push(connection.db);
    }
  }

  async query<T = unknown>(sql: string, params: any[] = []): Promise<T[]> {
    const connection = await this.getConnection();
    return new Promise((resolve, reject) => {
      connection.db.all(sql, params, (err, rows: T[]) => {
        connection.release();
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  async closeAll() {
    return new Promise<void>(async (resolve, reject) => {
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
    });
  }

  private _createNewDatabasePoolConnection(db: sqlite3.Database): DatabasePoolConnection<sqlite3.Database> {
    const release = () => this.releaseConnection({ db, release: () => undefined });
    return { db, release };
  }

  private _createNewSQLiteConnection(): Promise<sqlite3.Database> {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this._databasePath, (err) => {
        if (err) {
          return reject(err)
        };
        resolve(db);
      });
    });
  }
}
  */
