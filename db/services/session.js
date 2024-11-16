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

function insertSessionToken(db, userId, refreshToken, tableName = "session") {
  return new Promise(async (resolve, reject) => {
    try {
      const query = `INSERT INTO ${tableName} (userId, token) VALUES (?, ?)`;
      db.run(query, [userId, refreshToken], (err) => {
        if (err) {
          return reject(err);
        }
        return resolve();
      });
    } catch (e) {
      return reject(e);
    }
  });
}

function updateSessionToken(db, userId, token, tableName = "session") {
  return new Promise(async (resolve, reject) => {
    try {
      db.run(`UPDATE ${tableName} SET token = ? WHERE userId = ?`, [token, userId], (err) => {
        if (err) {
          return reject(err);
        }
        return resolve();
      });
    } catch (e) {
      return reject(e);
    }
  });
}

function selectSessionTokenByUserID(db, userId, tableName = "refresh_token") {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM ${tableName} WHERE userId = ?`, [userId], (err, row) => {
      if (err) {
        return reject(err);
      }
      return resolve(row);
    });
  });
}

function updateOrInsertSessionToken(db, userId, token, tableName = "session") {
  return new Promise(async (resolve, reject) => {
    try {
      const existing = await selectSessionTokenByUserID(db, userId);
      if (existing && existing?.token) {
        // If already exists, just update it.
        await updateSessionToken(db, userId, token, tableName);
        return resolve();
      }
      await insertSessionToken(db, userId, token, tableName);
      return resolve();
    } catch (e) {
      return reject(e);
    }
  });
}

function deleteSessionTokenByUserId(db, userId, tableName = "session") {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`DELETE FROM ${tableName} WHERE userId = ?`, userId, function (err) {
        if (err) {
          return reject(err);
        }
        if (this.changes !== 1) {
          return reject(new Error("unable to remove refresh token!"));
        }
        return resolve();
      });
    });
  });
}

function deleteSessionToken(db, token, tableName = "session") {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`DELETE FROM ${tableName} WHERE token = ?`, token, function (err) {
        if (err) {
          return reject(err);
        }
        if (this.changes !== 1) {
          return reject(new Error("unable to remove refresh token!"));
        }
        return resolve();
      });
    });
  });
}
