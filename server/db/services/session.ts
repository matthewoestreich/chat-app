import sqlite3 from "sqlite3";

/**
 *
 * EXPORT FUNCTIONS AS OBJECT
 *
 */
export default {
  insert: insertSessionToken,
  update: updateSessionToken,
  delete: deleteSessionToken,
  deleteByUserId: deleteSessionTokenByUserId,
  updateOrInsert: updateOrInsertSessionToken,
  selectByUserId: selectSessionTokenByUserID,
};

function insertSessionToken(db: sqlite3.Database, userId: string, sessionToken: string, tableName = "session") {
  return new Promise(async (resolve, reject) => {
    try {
      const query = `INSERT INTO ${tableName} (userId, token) VALUES (?, ?)`;
      db.run(query, [userId, sessionToken], (err) => {
        if (err) {
          return reject(err);
        }
        return resolve(true);
      });
    } catch (e) {
      return reject(e);
    }
  });
}

function updateSessionToken(db: sqlite3.Database, userId: string, sessionToken: string, tableName = "session"): Promise<boolean> {
  return new Promise(async (resolve, reject) => {
    try {
      db.run(`UPDATE ${tableName} SET token = ? WHERE userId = ?`, [sessionToken, userId], (err) => {
        if (err) {
          return reject(err);
        }
        return resolve(true);
      });
    } catch (e) {
      return reject(e);
    }
  });
}

function selectSessionTokenByUserID(db: sqlite3.Database, userId: string, tableName = "session"): Promise<Session> {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM ${tableName} WHERE userId = ?`, [userId], (err, row) => {
      if (err) {
        return reject(err);
      }
      return resolve(row as Session);
    });
  });
}

function updateOrInsertSessionToken(db: sqlite3.Database, userId: string, sessionToken: string, tableName = "session"): Promise<boolean> {
  return new Promise(async (resolve, reject) => {
    try {
      const existing = await selectSessionTokenByUserID(db, userId);
      if (existing && existing?.token) {
        // If already exists, just update it.
        await updateSessionToken(db, userId, sessionToken, tableName);
        return resolve(true);
      }
      await insertSessionToken(db, userId, sessionToken, tableName);
      return resolve(true);
    } catch (e) {
      return reject(e);
    }
  });
}

function deleteSessionTokenByUserId(db: sqlite3.Database, userId: string, tableName = "session"): Promise<boolean> {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`DELETE FROM ${tableName} WHERE userId = ?`, userId, function (err) {
        if (err) {
          return reject(err);
        }
        if (this.changes !== 1) {
          return reject(new Error("unable to remove refresh token!"));
        }
        return resolve(true);
      });
    });
  });
}

function deleteSessionToken(db: sqlite3.Database, sessionToken: string, tableName = "session"): Promise<boolean> {
  return new Promise((resolve, reject) => {
    try {
      db.serialize(() => {
        db.run(`DELETE FROM ${tableName} WHERE token = ?`, sessionToken, function (err) {
          if (err) {
            return reject(err);
          }
          return resolve(true);
        });
      });
    } catch (e) {
      console.log(`[sessionService][deleteSessionToken][ERROR]`, e);
      reject(e);
    }
  });
}
