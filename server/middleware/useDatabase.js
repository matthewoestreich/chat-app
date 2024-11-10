import sqlite3 from "sqlite3";
import path from "path";
sqlite3.verbose();

async function getDbConnection(dbPath) {
  return new Promise((resolve, reject) => {
    try {
      const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(db);
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Attaches sqlite database to the req object as `req.db`.
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
export default async function (req, res, next) {
  try {
    const db = await getDbConnection(path.resolve(import.meta.dirname, "../../db/rtchat.db"));
    req.db = db;
  } catch (e) {
    console.log(`[router][useDatabase] error getting db handle`, { e });
    throw new Error(`[router][useDatabase] error getting db handle ${e.message}`);
  }
  next();
}
