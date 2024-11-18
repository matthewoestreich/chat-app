import sqlite3 from "sqlite3";

export default class SQLitePoolConnection implements DatabasePoolConnection<sqlite3.Database> {
  private _isLoaned = false;
  get isLoaned(): boolean {
    return this._isLoaned;
  }
  set isLoaned(v: boolean) {
    this._isLoaned = v;
  }

  db: sqlite3.Database;
  release: () => void;

  constructor(db: sqlite3.Database, parent: DatabasePool<sqlite3.Database>) {
    this.db = db;
    this.release = () => parent.releaseConnection(this);
  }
}
