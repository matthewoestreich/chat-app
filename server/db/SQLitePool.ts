import sqlite3 from "sqlite3";
import SQLitePoolConnection from "./SQLitePoolConnection";
import Mutex from "@/server/Mutex";
sqlite3.verbose();

export default class SQLitePool implements DatabasePool<sqlite3.Database> {
  private _createdConnectionsCount = 0;
  private _mutex = new Mutex();

  private _pool: sqlite3.Database[];
  get size(): Promise<number> {
    return new Promise(async (resolve) => {
      await this._mutex.lock();
      const s = this._pool.length;
      this._mutex.unlock();
      resolve(s);
    });
  }

  private _databasePath: string;
  get databasePath(): string {
    return this._databasePath;
  }

  private _maxConnections: number = 5; // Default to 5
  get maxConnections(): number {
    return this._maxConnections;
  }

  private _pendingRequests: Array<(connection: SQLitePoolConnection) => void>;
  get pendingRequestsSize(): Promise<number> {
    return new Promise(async (resolve) => {
      await this._mutex.lock();
      const s = this._pendingRequests.length;
      this._mutex.unlock();
      resolve(s);
    });
  }

  constructor(databasePath: string, maxConnections: number) {
    this._databasePath = databasePath;
    this._maxConnections = maxConnections;
    this._pool = [];
    this._pendingRequests = [];
  }

  private async closeSQLiteDatabaseConnection(db: sqlite3.Database): Promise<boolean> {
    return new Promise((resolve, reject) => {
      return db.close((err) => {
        if (err) {
          return reject(err);
        }
        return resolve(true);
      });
    });
  }

  private async createSQLiteDatabaseConnection(): Promise<sqlite3.Database> {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this._databasePath, (err) => {
        if (err) {
          return reject(err);
        }
        return resolve(db);
      });
    });
  }

  private createDatabasePoolConnection(db: sqlite3.Database): SQLitePoolConnection {
    return new SQLitePoolConnection(db, this);
  }

  getConnection(): Promise<SQLitePoolConnection> {
    return new Promise(async (resolve, reject) => {
      await this._mutex.lock();
      const db = this._pool.pop();

      if (db) {
        const connection = this.createDatabasePoolConnection(db);
        this._mutex.unlock();
        return resolve(connection);
      }

      if (this._createdConnectionsCount < this._maxConnections) {
        try {
          const db = await this.createSQLiteDatabaseConnection();
          this._createdConnectionsCount++;
          this._mutex.unlock();
          return resolve(this.createDatabasePoolConnection(db));
        } catch (e) {
          this._mutex.unlock();
          reject(e);
        }
      }

      this._pendingRequests.push(resolve);
      this._mutex.unlock();
    });
  }

  async releaseConnection(connection: SQLitePoolConnection): Promise<void> {
    await this._mutex.lock();
    const resolve = this._pendingRequests.shift(); // FIFO

    if (resolve) {
      this._mutex.unlock();
      return resolve(this.createDatabasePoolConnection(connection.db));
    }

    this._pool.push(connection.db);
    this._mutex.unlock();
  }

  async query(sql: string, params: any): Promise<unknown> {
    const connection = await this.getConnection();

    return new Promise(async (resolve, reject) => {
      await this._mutex.lock();

      connection.db.all(sql, params, (err, rows) => {
        connection.release(); // Release the connection back to the pool
        if (err) {
          this._mutex.unlock();
          return reject(err);
        }
        this._mutex.unlock();
        return resolve(rows);
      });

      this._mutex.unlock();
    });
  }

  async closeAll(): Promise<boolean> {
    return new Promise<boolean>(async (resolve, reject) => {
      await this._mutex.lock();

      if (this._pool.length === 0) {
        this._mutex.unlock();
        return resolve(true);
      }

      // Acts like a safety net to protect against infinite loops.
      // Twice pool length + max allowed connections should be large enough for an upper bound.
      let iterations = 0;
      const maxIterations = this._pool.length * 2 + this._maxConnections;

      while (this._pool.length && iterations < maxIterations) {
        const db = this._pool.shift();
        if (db) {
          try {
            await this.closeSQLiteDatabaseConnection(db);
          } catch (e) {
            this._mutex.unlock();
            return reject(e);
          }
        }
        iterations++;
      }

      this._mutex.unlock();
      return resolve(true);
    });
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
