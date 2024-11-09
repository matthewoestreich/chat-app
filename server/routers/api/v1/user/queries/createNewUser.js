import bcrypt from "bcrypt";

/**
 * Adds new user to database.
 * Salts and hashes password.
 * @param {string} name
 * @param {string} id must be valid uuidv7
 * @param {string} passwd
 * @param {sqlite3.Database} db
 * @param {string} tableName
 */
export default async function createNewUser(name, id, passwd, db, tableName="user") {
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
          resolve();
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}