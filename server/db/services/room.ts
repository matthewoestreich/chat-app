import sqlite3 from "sqlite3";

export default {
  insert: insertRoom,
  selectAllPublicRooms,
};

function selectAllPublicRooms(db: sqlite3.Database): Promise<Room[]> {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM room WHERE isPrivate = 0`, [], (err, rows) => {
      if (err) {
        return reject(err);
      }
      return resolve(rows as Room[]);
    });
  });
}

function insertRoom(db: sqlite3.Database, roomName: string, id: string) {
  return new Promise(async (resolve, reject) => {
    try {
      const query = `INSERT INTO room (id, name) VALUES (?, ?)`;

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
