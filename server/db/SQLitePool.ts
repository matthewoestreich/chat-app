import sqlite3 from "sqlite3";
import SQLitePoolConnection from "./SQLitePoolConnection";
import Mutex from "@/server/Mutex";
sqlite3.verbose();

export default class SQLitePool implements DatabasePool<sqlite3.Database> {
  private _mutex = new Mutex();

  private _isDraining = false;
  get isDraining() {
    return this._isDraining;
  }

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

  private _pendingConnections: Array<{ resolve: (connection: SQLitePoolConnection) => void; reject: (reason?: any) => void }> = [];
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

  private closeConnection(connection: SQLitePoolConnection): boolean {
    connection.db.close((err) => {
      if (err) {
        console.error(err);
        return false;
      }
    });

    connection.isClosed = true;

    const activeIndex = this._activeConnections.findIndex((c) => c.id === connection.id);
    if (activeIndex > -1) {
      this._activeConnections.splice(activeIndex, 1);
    }

    const idleIndex = this._idleConnections.findIndex((c) => c.id === connection.id);
    if (idleIndex > -1) {
      this._idleConnections.splice(idleIndex, 1);
    }

    return true;
  }

  getConnection(): Promise<SQLitePoolConnection> {
    return new Promise(async (resolve, reject) => {
      if (this._isDraining) {
        console.warn(`[DENIED][getConnection] Pool is draining. Cannot perform any tasks while pool is draining.`);
        return;
      }
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

      // All connections are all busy, push to pending.
      this._pendingConnections.push({ resolve, reject });
      this._mutex.unlock();
    });
  }

  async releaseConnection(connection: SQLitePoolConnection): Promise<void> {
    if (connection.isClosed) {
      console.warn(`[releaseConnection] cannot release a closed connection`);
      this._mutex.unlock();
      return;
    }
    if (this._isDraining) {
      console.warn(`[DENIED][releaseConnection] Pool is draining. Cannot perform any tasks while pool is draining.`);
      return;
    }
    await this._mutex.lock();

    const pending = this._pendingConnections.shift(); // FIFO
    if (pending) {
      this._mutex.unlock();
      return pending.resolve(connection);
    }

    const activeConnectionIndex = this._activeConnections.findIndex((c) => c.id === connection.id);
    if (activeConnectionIndex >= 0) {
      this._activeConnections.splice(activeConnectionIndex, 1);
    }

    // Prevent adding closed connections to idle
    if (connection.isClosed) {
      this._mutex.unlock();
      return;
    }

    if (this._idleConnections.length + this._activeConnections.length >= this._maxConnections) {
      this.closeConnection(connection);
    } else {
      this._idleConnections.push(connection);
    }
    this._mutex.unlock();
  }

  async query(sql: string, params: any): Promise<unknown> {
    if (this._isDraining) {
      console.warn(`[DENIED][query] Pool is draining. Cannot perform any tasks while pool is draining.`);
      return;
    }
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

  async closeAllIdleConnections(): Promise<boolean> {
    return new Promise<boolean>(async (resolve, reject) => {
      if (this._isDraining) {
        console.warn(`[DENIED][closeAllIdleConnections] Pool is draining. Cannot perform any tasks while pool is draining.`);
        return;
      }
      try {
        await this._mutex.lock();

        if (this._idleConnections.length === 0) {
          this._mutex.unlock();
          return resolve(true);
        }

        while (this._idleConnections.length) {
          const idleConnection = this._idleConnections.shift();
          if (idleConnection) {
            await this.closeConnection(idleConnection);
          }
        }

        this._mutex.unlock();
        return resolve(true);
      } catch (e) {
        return reject(e);
      }
    });
  }

  async closeAllActiveConnections(): Promise<boolean> {
    return new Promise<boolean>(async (resolve, reject) => {
      if (this._isDraining) {
        console.warn(`[DENIED][closeAllActiveConnections] Pool is draining. Cannot perform any tasks while pool is draining.`);
        return;
      }
      try {
        await this._mutex.lock();

        if (this._activeConnections.length === 0) {
          this._mutex.unlock();
          return resolve(true);
        }

        for (const activeConnection of this._activeConnections) {
          await this.closeConnection(activeConnection);
        }

        this._activeConnections = [];

        this._mutex.unlock();
        return resolve(true);
      } catch (e) {
        return reject(e);
      }
    });
  }

  async drain(): Promise<boolean> {
    this._isDraining = true;
    return new Promise<boolean>(async (resolve, reject) => {
      await this._mutex.lock();

      try {
        // Step 1: Resolve all pending connections
        while (this._pendingConnections.length) {
          const pending = this._pendingConnections.shift();
          if (pending) {
            pending.reject(new Error("Pool drained"));
          }
        }

        // Step 2: Close active connections
        //for (const connection of [...this._activeConnections]) {
        //  if (!connection.isClosed) {
        //    this.logState(`[drain][ACTIVE] found active connection to close!`, connection);
        //    await this.closeConnection(connection);
        //  } else {
        //    this.logState(`[drain][ACTIVE][warn] found active connection but it is already closed!!`, connection);
        //  }
        //}
        await Promise.allSettled(this._activeConnections.map((conn) => this.closeConnection(conn)));
        this._activeConnections = [];

        // Step 3: Close idle connections
        //for (const connection of [...this._idleConnections]) {
        //  if (!connection.isClosed) {
        //    await this.closeConnection(connection);
        //    this.logState(`[drain][IDLE] found idle connection to close!`, connection);
        //  } else {
        //    this.logState(`[drain][IDLE][warn] found idle connection but it is already closed!`, connection);
        //  }
        //}
        await Promise.allSettled(this._idleConnections.map((conn) => this.closeConnection(conn)));
        this._idleConnections = [];
      } catch (e) {
        this._isDraining = false;
        this._mutex.unlock();
        return reject(e);
      }

      this._isDraining = false;
      this._mutex.unlock();
      return resolve(true);
    });
  }
}
