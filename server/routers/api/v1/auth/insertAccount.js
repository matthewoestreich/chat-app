import bcrypt from "bcrypt";

/**
 * Adds new user to database.
 * Salts and hashes password.
 * @param {sqlite3.Database} db
 * @param {string} name
 * @param {string} passwd
 * @param {string} id
 * @param {string} tableName
 */
export default async function (db, name, id, passwd, tableName = "user") {
  return new Promise(async (resolve, reject) => {
    try {
      const statement = db.prepare(`INSERT INTO ${tableName} (id, name, password) VALUES (?, ?, ?)`);
      const salt = await bcrypt.genSalt(10);
      const hashedPw = await bcrypt.hash(passwd, salt);

      statement.run(id, name, hashedPw);

      statement.finalize((err) => {
        if (err) {
          reject(err);
        } else {
          resolve({ id });
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}
