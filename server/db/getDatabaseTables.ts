import path from "path";
import fs from "fs";
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
        //rows.forEach((row) => console.log(row.name));
        resolve(rows);
      });
    });

    db.close();
  });
}

export function dbInterval() {
  const dbpath = path.resolve(__dirname, "../../tmp/rtchat");
  setInterval(() => {
    console.log("Checking /tmp/rtchat");
    if (fs.existsSync(dbpath)) {
      console.log("Database file exists");
      fs.stat(dbpath, (err, stats) => {
        if (err) {
          console.error("Error checking file stats:", err);
        } else {
          console.log(`File size: ${stats.size} bytes`);
        }
      });
    } else {
      console.log("Database file does not exist");
    }
  }, 5000); // Check every 5 seconds
}
