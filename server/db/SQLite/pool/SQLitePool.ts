import sqlite3 from "sqlite3";
import SQLitePoolConnection from "./SQLitePoolConnection";
import Mutex from "@server/Mutex";
import { DatabasePool } from "@server/types";
sqlite3.verbose();

export default class SQLitePool implements DatabasePool<sqlite3.Database> {
  private _mutex = new Mutex();

  private _activeConnections: SQLitePoolConnection[] = [];
  get activeConnectionsSize(): Promise<number> {
    return new Promise(async (resolve) => {
      await this._mutex.lock();
      const s = this._activeConnections.length;
      this._mutex.unlock();
      resolve(s);
    });
  }

  private _idleConnections: SQLitePoolConnection[] = [];
  get idleConnectionsSize(): Promise<number> {
    return new Promise(async (resolve) => {
      await this._mutex.lock();
      const s = this._idleConnections.length;
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

  private _pendingConnections: Array<{ resolve: (connection: SQLitePoolConnection) => void; reject: (reason?: Error | string) => void }> = [];
  get pendingConnectionsSize(): Promise<number> {
    return new Promise(async (resolve) => {
      await this._mutex.lock();
      const s = this._pendingConnections.length;
      this._mutex.unlock();
      resolve(s);
    });
  }

  private get _size(): number {
    return this._idleConnections.length + this._activeConnections.length;
  }
  get size(): Promise<number> {
    return new Promise(async (resolve) => {
      await this._mutex.lock();
      const s = this._idleConnections.length + this._activeConnections.length;
      this._mutex.unlock();
      resolve(s);
    });
  }

  constructor(databasePath: string, maxConnections: number) {
    this._databasePath = databasePath;
    this._maxConnections = maxConnections;
  }

  private async createConnection(db?: sqlite3.Database): Promise<SQLitePoolConnection> {
    return new Promise((resolve, reject) => {
      if (db) {
        return resolve(new SQLitePoolConnection(db, this));
      }
      const _db = new sqlite3.Database(this._databasePath, (err) => {
        if (err) {
          return reject(err);
        }
      });
      return resolve(new SQLitePoolConnection(_db, this));
    });
  }

  private async closeConnection(connection: SQLitePoolConnection): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        connection.db.close((err) => {
          if (err) {
            console.error(err);
            return reject(err);
          }
        });
        connection.isStale = true;
        this._activeConnections = this._activeConnections.filter((ac) => ac.id !== connection.id);
        this._idleConnections = this._idleConnections.filter((ic) => ic.id !== connection.id);
        return resolve(true);
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Get a connection from the pool.
   * @returns
   */
  getConnection(): Promise<SQLitePoolConnection> {
    return new Promise(async (resolve, reject) => {
      await this._mutex.lock();

      const connection = this._idleConnections.pop();
      // Re-use a connection that was idle..
      if (connection) {
        this._activeConnections.push(connection);
        this._mutex.unlock();
        return resolve(connection);
      }

      // Create brand new fresh connection
      if (this._size < this._maxConnections) {
        try {
          const connection = await this.createConnection();
          this._activeConnections.push(connection);
          this._mutex.unlock();
          return resolve(connection);
        } catch (e) {
          this._mutex.unlock();
          return reject(e);
        }
      }

      // All connections are busy, push to pending.
      this._pendingConnections.push({ resolve, reject });
      this._mutex.unlock();
    });
  }

  /**
   * Release a connection back to the pool
   * @param connection
   * @returns
   */
  async releaseConnection(connection: SQLitePoolConnection): Promise<void> {
    await this._mutex.lock();

    // Cannot release an active connection to idle if we have no active connections.
    // This means a connection that was "leased" prior to a drain (or closeAll) is requesting to be released.
    // We consider this connection stale.
    if (connection.isStale || this._activeConnections.length === 0) {
      console.warn(`[releaseConnection] Stale connection (${connection.id}) requested release. Pool has no active connections to release.`);
      this._mutex.unlock();
      return;
    }

    const pending = this._pendingConnections.shift(); // FIFO
    if (pending) {
      pending.resolve(connection);
      this._mutex.unlock();
      return;
    }

    // Remove from active connections if exists as such.
    this._activeConnections = this._activeConnections.filter((ac) => ac.id !== connection.id);

    // Overflow, close anything over the limit instead of releasing back to pool.
    if (this._idleConnections.length + this._activeConnections.length >= this._maxConnections) {
      this.closeConnection(connection);
      this._mutex.unlock();
      return;
    }

    this._idleConnections.push(connection);
    this._mutex.unlock();
  }

  /**
   * Send a sql query
   * @param sql
   * @param params
   * @returns
   */
  async query(sql: string, params: unknown[]): Promise<unknown> {
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

  private async closeAll(type: "Active" | "Idle"): Promise<boolean> {
    return new Promise<boolean>(async (resolve, reject) => {
      try {
        await this._mutex.lock();

        let bucket = this._idleConnections;
        if (type === "Active") {
          bucket = this._activeConnections;
        }

        if (bucket.length === 0) {
          this._mutex.unlock();
          return resolve(true);
        }

        while (bucket.length) {
          const conn = bucket.shift();
          if (conn) {
            this.closeConnection(conn);
          }
        }

        this._mutex.unlock();
        return resolve(true);
      } catch (e) {
        return reject(e);
      }
    });
  }

  async closeAllIdleConnections(): Promise<boolean> {
    return this.closeAll("Idle");
  }

  async closeAllActiveConnections(): Promise<boolean> {
    return this.closeAll("Active");
  }

  async drain(): Promise<boolean> {
    return new Promise<boolean>(async (resolve, reject) => {
      try {
        await this._mutex.lock();

        this._pendingConnections.forEach((pc) => pc.reject(new Error("Pool draining")));
        this._activeConnections.forEach((ac) => this.closeConnection(ac));
        this._idleConnections.forEach((ic) => this.closeConnection(ic));

        this._activeConnections = [];
        this._idleConnections = [];
        this._pendingConnections = [];

        this._mutex.unlock();
        return resolve(true);
      } catch (e) {
        this._mutex.unlock();
        return reject(e);
      }
    });
  }
}
