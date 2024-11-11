import bcrypt, { hash } from "bcrypt";
import { selectAccountByEmail } from "./selectAccount.js";

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
export default async function (db, name, id, passwd, email, tableName = "user") {
  return new Promise(async (resolve, reject) => {
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPw = await bcrypt.hash(passwd, salt);
      const query = `INSERT INTO ${tableName} (id, name, password, email) VALUES (?, ?, ?, ?)`;

      db.run(query, [id, name, hashedPw, email], (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve({ name, id, email });
      });
    } catch (e) {
      reject(e);
    }
  });
}
