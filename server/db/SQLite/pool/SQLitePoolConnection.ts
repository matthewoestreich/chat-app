import sqlite3 from "sqlite3";
import { v7 as uuidV7 } from "uuid";
import SQLitePool from "./SQLitePool";
import { DatabasePoolConnection } from "@server/types";

export default class SQLitePoolConnection implements DatabasePoolConnection<sqlite3.Database> {
  id: string;
  db: sqlite3.Database;
  release: () => void;
  isStale: boolean = false;

  constructor(db: sqlite3.Database, parent: SQLitePool) {
    this.db = db;
    this.release = (): void => {
      if (this.isStale) {
        return;
      }
      parent.releaseConnection(this);
    };
    this.id = uuidV7();
  }
}
