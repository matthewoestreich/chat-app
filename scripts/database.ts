import nodeFs from "node:fs";
import nodePath from "node:path";
import sqlite3 from "sqlite3";
sqlite3.verbose();

export const DATABASE_FILE_NAME = "rtchat.db";
export const BACKUP_FILE_NAME = "backup.sql";
export const DATABASE_PATH = nodePath.resolve(__dirname, `../server/db/${DATABASE_FILE_NAME}`);
export const BACKUP_FILE_PATH = nodePath.resolve(__dirname, `../server/db/${BACKUP_FILE_NAME}`);

const DELIMITER = "~~__~~";

export async function backupDatabase(dbPath = DATABASE_PATH, backupPath = BACKUP_FILE_PATH, delimiter = DELIMITER) {
  return new Promise((resolve, reject) => {
    try {
      if (!nodeFs.existsSync(dbPath)) {
        return reject(`No database found at dbPath:'${dbPath}'`);
      }

      const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);
      const backupStream = nodeFs.createWriteStream(backupPath);

      db.serialize(() => {
        backupStream.write(`PRAGMA foreign_keys=OFF;${delimiter}\nBEGIN TRANSACTION;${delimiter}\n`);

        // Write schema
        db.all(`SELECT sql FROM sqlite_master WHERE type IN ('table', 'index', 'trigger') AND sql NOT NULL`, (err, rows) => {
          if (err) {
            console.error("Error exporting schema:", err);
            return reject(err);
          }

          rows.forEach((row) => {
            // @ts-ignore
            // prettier-ignore
            const sql = String(row.sql).trim()
              .replace("CREATE TABLE", "CREATE TABLE IF NOT EXISTS")
              .replace("CREATE INDEX", "CREATE INDEX IF NOT EXISTS")
              .replace("CREATE TRIGGER", "CREATE TRIGGER IF NOT EXISTS");
            // @ts-ignore
            backupStream.write(`${sql};${delimiter}\n`);
          });

          // Write data
          db.all(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`, (err, tables) => {
            if (err) {
              console.error("Error getting table names:", err);
              return reject(err);
            }

            tables.forEach((table) => {
              // @ts-ignore
              const tableName = table.name;

              db.each(
                `SELECT * FROM ${tableName}`,
                (err, row) => {
                  if (err) {
                    console.error(`Error reading data from table ${tableName}:`, err);
                    return reject(err);
                  }

                  // @ts-ignore
                  const columns = Object.keys(row).map((key) => `"${key}"`);
                  // @ts-ignore
                  const values = Object.values(row).map((value) => (value === null ? "NULL" : `'${value.toString().replace(/'/g, "''")}'`));

                  const insertStmt = `INSERT OR IGNORE INTO "${tableName}" (${columns.join(", ")}) VALUES (${values.join(", ")});`;
                  backupStream.write(insertStmt + delimiter + "\n");
                },
                (err) => {
                  if (err) {
                    console.error(`Error completing table ${tableName}:`, err);
                    reject(err);
                  }
                },
              );
            });

            db.close(() => {
              backupStream.write("COMMIT;\n");
              backupStream.end(() => {
                resolve(null);
              });
            });
          });
        });
      });
    } catch (e) {
      console.error(`Something went wrong during backup.`, e);
      reject(e);
    }
  });
}

/**
 * Restores db from .sql file
 * @param dbPath
 * @param backupPath
 * @returns
 */
export async function restoreDatabase(dbPath = DATABASE_PATH, backupPath = BACKUP_FILE_PATH, delimiter = DELIMITER) {
  return new Promise((resolve, reject) => {
    try {
      const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error("Error opening database:", err.message);
          return reject(err);
        }
      });

      // Read 'dump' file.
      const data = nodeFs.readFileSync(backupPath, "utf-8");
      // Split the SQL statements and execute them one by one
      const sqlStatements = data.split(delimiter).map((s) => s.trim());

      db.serialize(() => {
        sqlStatements.forEach((statement) => {
          db.run(statement, (err) => {
            if (err) {
              console.error("[restoreDb] Error executing statement:", statement, err.message);
              return reject(err);
            }
          });
        });
      });

      db.close((err) => {
        if (err) {
          console.error("[restoreDb] Database restored successfully, but we encountered an error closing database:", err);
        }
        resolve(null);
      });
    } catch (e) {
      console.error(`[restoreDb] something went wrong`, e);
      reject(e);
    }
  });
}
