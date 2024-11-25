import sqlite3 from "sqlite3";

export default {
  insert: insertRoom,
  selectAll: selectAllRooms,
  selectById: selectByRoomId,
  selectUnjoineddRooms: selectUnjoinedRoomsByUserId,
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

function selectUnjoinedRoomsByUserId(db: sqlite3.Database, userId: string): Promise<Room[]> {
  return new Promise((resolve, reject) => {
    const query = `
    SELECT 
        r.id, 
        r.name 
    FROM 
        room r
    LEFT JOIN 
        chat c ON r.id = c.roomId AND c.userId = ?
    WHERE 
        c.roomId IS NULL
    ORDER BY r.name ASC;
    `;
    db.all(query, [userId], (err, rows: Room[]) => {
      if (err) {
        return reject(err);
      }
      return resolve(rows);
    });
  });
}

function selectAllRooms(db: sqlite3.Database, privateOnly?: boolean): Promise<Room[]> {
  return new Promise((resolve, reject) => {
    const privateQuery = privateOnly ? "WHERE isPrivate = 1" : "";
    db.all(`SELECT * FROM room ${privateQuery} ORDER BY name ASC`, [], (err, rows: Room[]) => {
      if (err) {
        return reject(err);
      }
      return resolve(rows);
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
