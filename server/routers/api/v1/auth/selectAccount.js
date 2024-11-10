import bcrypt from "bcrypt";

export default function (db, userName, userId, tableName = "user") {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM ${tableName} WHERE name = ? AND id = ?`, [userName, userId], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row);
    });
  });
}
