export function selectAccountByEmail(db, email, tableName = "user") {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM ${tableName} WHERE email = ?`, [email], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row);
    });
  });
}
