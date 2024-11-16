import sqlite3 from "sqlite3";
sqlite3.verbose();

// You can use a different database/storage if you "implement" this class.
// Your class would need to have all properties and methods of this one.
// From there, modify each method for each service (within the "services" directory)
// to fit your database.
// From there all you have to do is modify the `useDbPool` middleware to include your
// newly crated pool.
export default class SQLitePool {
  /**
   *
   * @param {string} dbPath : ABSOLUTE PATH to database file
   * @param {*} maxConnections : int
   */
  constructor(dbPath, maxConnections = 5) {
    this.dbPath = dbPath;
    this.maxConnections = maxConnections;
    this.pool = [];
    this.pendingRequests = [];
  }

  getConnection() {
    return new Promise((resolve, reject) => {
      if (this.pool.length > 0) {
        const db = this.pool.pop();
        resolve(db);
      } else if (this.pool.length + this.pendingRequests.length < this.maxConnections) {
        const db = new sqlite3.Database(this.dbPath, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(db);
          }
        });
      } else {
        this.pendingRequests.push({ resolve, reject });
      }
    });
  }

  releaseConnection(db) {
    if (this.pendingRequests.length > 0) {
      const request = this.pendingRequests.shift();
      request.resolve(db);
    } else {
      this.pool.push(db);
    }
  }

  async query(sql, params) {
    const db = await this.getConnection();
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        this.releaseConnection(db);
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}
