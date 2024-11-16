import sqlite3 from "sqlite3";

export default {
  insert: insertRoom,
};

function insertRoom(db: sqlite3.Database, roomName: string, id: string, tableName = "room") {
  return new Promise(async (resolve, reject) => {
    try {
      const query = `INSERT INTO ${tableName} (id, name) VALUES (?, ?)`;

      db.run(query, [id, roomName], (err) => {
        if (err) {
          return reject(err);
        }
        return resolve({ roomName, id });
      });
    } catch (e) {
      return reject(e);
    }
  });
}
