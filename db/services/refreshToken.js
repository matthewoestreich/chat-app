/**
 *
 * EXPORT FUNCTIONS AS OBJECT
 *
 */
export default {
  insert: insertRefreshToken,
  update: updateRefreshToken,
  delete: deleteRefreshToken,
  deleteByUserId: deleteRefreshTokenByUserId,
  updateOrInsert: updateOrInsertRefreshToken,
  selectByUserId: selectRefreshTokenByUserID,
};

function insertRefreshToken(db, userId, refreshToken, tableName = "refresh_token") {
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

function updateRefreshToken(db, userId, token, tableName = "refresh_token") {
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

function selectRefreshTokenByUserID(db, userId, tableName = "refresh_token") {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM ${tableName} WHERE userId = ?`, [userId], (err, row) => {
      if (err) {
        return reject(err);
      }
      return resolve(row);
    });
  });
}

function updateOrInsertRefreshToken(db, userId, token, tableName = "refresh_token") {
  return new Promise(async (resolve, reject) => {
    try {
      const existing = await selectRefreshTokenByUserID(db, userId);
      if (existing && existing?.token) {
        // If already exists, just update it.
        await updateRefreshToken(db, userId, token, tableName);
        return resolve();
      }
      await insertRefreshToken(db, userId, token, tableName);
      return resolve();
    } catch (e) {
      return reject(e);
    }
  });
}

function deleteRefreshTokenByUserId(db, userId, tableName = "refresh_token") {
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

function deleteRefreshToken(db, token, tableName = "refresh_token") {
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
