import sqlite3 from "sqlite3";

export default {
  insert: insertRoom,
  selectAllPublicRooms,
  selectById: selectByRoomId,
};

function selectByRoomId(db: sqlite3.Database, roomId: string): Promise<Room> {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM room WHERE id = ?`, [roomId], (err, row: Room) => {
      if (err) {
        return reject(err);
      }
      return resolve(row);
    });
  });
}

function selectAllPublicRooms(db: sqlite3.Database): Promise<Room[]> {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM room WHERE isPrivate = 0`, [], (err, rows) => {
      if (err) {
        return reject(err);
      }
      return resolve(rows as Room[]);
    });
  });
}

function insertRoom(db: sqlite3.Database, roomName: string, id: string, isPrivate?: 0 | 1): Promise<Room> {
  return new Promise(async (resolve, reject) => {
    try {
      const privateStatus: 0 | 1 = isPrivate === undefined ? 0 : isPrivate; // default to public
      const query = `INSERT INTO room (id, name, isPrivate) VALUES (?, ?, ?)`;
      db.run(query, [id, roomName, privateStatus], (err) => {
        if (err) {
          return reject(err);
        }
        return resolve({ id, name: roomName, isPrivate: privateStatus });
      });
    } catch (e) {
      return reject(e);
    }
  });
}
