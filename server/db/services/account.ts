import bcrypt from "bcrypt";
import sqlite3 from "sqlite3";

/**
 *
 * EXPORT FUNCTIONS AS OBJECT
 *
 */
export default {
  insert: insertAccount,
  selectByEmail: selectAccountByEmail,
  selectById: selectAccountById,
};

/**
 * Adds new user to database.
 * Salts and hashes password.
 */
function insertAccount(db: sqlite3.Database, name: string, id: string, passwd: string, email: string, tableName = "user") {
  return new Promise(async (resolve, reject) => {
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPw = await bcrypt.hash(passwd, salt);
      const query = `INSERT INTO "${tableName}" (id, name, password, email) VALUES (?, ?, ?, ?)`;

      db.run(query, [id, name, hashedPw, email], (err) => {
        if (err) {
          return reject(err);
        }
        return resolve({ name, id, email });
      });
    } catch (e) {
      return reject(e);
    }
  });
}

function selectAccountByEmail(db: sqlite3.Database, email: string, tableName = "user"): Promise<Account> {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM "${tableName}" WHERE email = ?`, [email], (err, row) => {
      if (err) {
        return reject(err);
      }
      return resolve(row as Account);
    });
  });
}

function selectAccountById(db: sqlite3.Database, userId: string, tableName = "user"): Promise<Account> {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM "${tableName}" WHERE id = ?`, [userId], (err, row) => {
      if (err) {
        return reject(err);
      }
      return resolve(row as Account);
    });
  });
}
