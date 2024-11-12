import bcrypt from "bcrypt";

/**
 *
 * EXPORT FUNCTIONS AS OBJECT
 *
 */
export default {
  insert: insertAccount,
  selectByEmail: selectAccountByEmail,
};

/**
 * Adds new user to database.
 * Salts and hashes password.
 * @param {sqlite3.Database} db
 * @param {string} name
 * @param {string} passwd
 * @param {string} id
 * @param {string} email
 * @param {string} tableName
 */
function insertAccount(db, name, id, passwd, email, tableName = "user") {
  return new Promise(async (resolve, reject) => {
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPw = await bcrypt.hash(passwd, salt);
      const query = `INSERT INTO ${tableName} (id, name, password, email) VALUES (?, ?, ?, ?)`;

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

function selectAccountByEmail(db, email, tableName = "user") {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM ${tableName} WHERE email = ?`, [email], (err, row) => {
      if (err) {
        return reject(err);
      }
      return resolve(row);
    });
  });
}
