import path from "path";
import sqlite3 from "sqlite3";
sqlite3.verbose();

export default function getDatabaseTables() {
  return new Promise((resolve) => {
    const db = new sqlite3.Database(path.resolve(__dirname, process.env.ABSOLUTE_DB_PATH!));
    db.serialize(() => {
      db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';", (err, rows: any[]) => {
        if (err) {
          console.error("Error fetching tables:", err);
          resolve(false);
        }
        console.log("Tables in the database:");
        rows.forEach((row) => console.log(row.name));
        resolve(true);
      });
    });

    db.close();
  });
}
