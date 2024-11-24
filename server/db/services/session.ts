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
  upsert: upsertSessionToken,
  selectByUserId: selectSessionTokenByUserID,
};

function insertSessionToken(db: sqlite3.Database, userId: string, sessionToken: string) {
  return new Promise(async (resolve, reject) => {
    try {
      const query = `INSERT INTO session (userId, token) VALUES (?, ?)`;
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

function updateSessionToken(db: sqlite3.Database, userId: string, sessionToken: string): Promise<boolean> {
  return new Promise(async (resolve, reject) => {
    try {
      db.run(`UPDATE session SET token = ? WHERE userId = ?`, [sessionToken, userId], (err) => {
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

function selectSessionTokenByUserID(db: sqlite3.Database, userId: string): Promise<Session> {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM session WHERE userId = ?`, [userId], (err, row) => {
      if (err) {
        return reject(err);
      }
      return resolve(row as Session);
    });
  });
}

function upsertSessionToken(db: sqlite3.Database, userId: string, sessionToken: string): Promise<boolean> {
  return new Promise(async (resolve, reject) => {
    try {
      const query = `INSERT INTO session (userId, token) VALUES (?, ?) ON CONFLICT(userId) DO UPDATE SET token = excluded.token;`;
      db.run(query, [userId, sessionToken], function (err) {
        if (err) {
          console.error("Error upserting session:", err.message);
          return reject(err);
        }
        console.log("Session upserted:", { userId, sessionToken });
        return resolve(true);
      });
    } catch (e) {
      return reject(e);
    }
  });
}

function deleteSessionTokenByUserId(db: sqlite3.Database, userId: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`DELETE FROM session WHERE userId = ?`, userId, function (err) {
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

function deleteSessionToken(db: sqlite3.Database, sessionToken: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    try {
      db.serialize(() => {
        db.run(`DELETE FROM session WHERE token = ?`, sessionToken, function (err) {
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
