import sqlite3 from "sqlite3";
import { v7 as uuidV7 } from "uuid";
import SQLitePool from "./SQLitePool";

export default class SQLitePoolConnection implements DatabasePoolConnection<sqlite3.Database> {
  id: string;
  db: sqlite3.Database;
  isClosed: boolean;
  release: (msg?: string) => void;

  constructor(db: sqlite3.Database, parent: SQLitePool) {
    this.db = db;
    this.isClosed = false;
    this.release = (msg) => {
      console.log(msg);
      if (parent.isDraining) {
        console.warn(`[DENIED][SQLitePoolConnection.release] Pool is draining. Cannot perform any tasks while pool is draining.`);
        return;
      }
      if (this.isClosed) {
        console.error(`Cannot release a closed connection:`, this);
        return;
      }
      parent.releaseConnection(this);
    };
    this.id = uuidV7();
  }
}
