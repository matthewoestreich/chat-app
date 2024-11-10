import bcrypt from "bcrypt";
import selectAccount from "./selectAccount.js";

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

      statement.finalize(async (err) => {
        if (err) {
          reject(err);
          return;
        }
        try {
          const addedUser = await selectAccount(db, name, id);
          if (!addedUser || !addedUser?.name || !addedUser?.id) {
            throw new Error("cannot get newly inserted user!");
          }
          resolve({ name: addedUser?.name, id: addedUser?.id });
        } catch (e) {
          resolve({ name: encodeURIComponent(name), id });
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}
