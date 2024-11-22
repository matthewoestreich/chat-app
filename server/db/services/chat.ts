import sqlite3 from "sqlite3";
sqlite3.verbose();

export default {
  selectRoomsByUserId: selectAllRoomsByUserId,
  addUserByIdToRoomById: insertUserByIdToRoomById,
  selectAllRoomsAndMembersByUserId: selectAllRoomsAndRoomMembersByUserId,
  selectRoomMembersByRoomId: selectRoomMembersByRoomId,
  selectRoomMembersByRoomIdIgnoreUserId,
};

function selectAllRoomsByUserId(db: sqlite3.Database, userId: string, tableName = "chat", roomTableName = "room") {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT r.id, r.name
      FROM ${roomTableName} r
      JOIN ${tableName} c ON r.id = c.roomId
      WHERE c.userId = ?
      ORDER BY r.name ASC
    `;

    db.all(query, [userId], (err, rows) => {
      if (err) {
        return reject(err);
      }
      return resolve(rows);
    });
  });
}

function selectRoomMembersByRoomId(db: sqlite3.Database, roomId: string, chatTableName = "chat", roomTableName = "room", userTableName = "user"): Promise<RoomMember[]> {
  return new Promise((resolve, reject) => {
    const query = `
    SELECT 
        r.id AS roomId,
        u.name AS userName,
        u.id AS userId
    FROM 
        ${chatTableName} c1
    JOIN 
        ${roomTableName} r ON c1.roomId = r.id
    JOIN 
        "${userTableName}" u ON c1.userId = u.id
    WHERE 
        --c1.userId = ?
        r.id = ? ;
  `;

    db.all(query, [roomId], (err, rows: RoomMember[]) => {
      if (err) {
        return reject(err);
      }
      return resolve(rows);
    });
  });
}

// Like when you want to get all roooms but not for "yourself".
function selectRoomMembersByRoomIdIgnoreUserId(db: sqlite3.Database, roomId: string, userToIgnore: string, chatTableName = "chat", roomTableName = "room", userTableName = "user"): Promise<RoomMember[]> {
  return new Promise((resolve, reject) => {
    const query = `
    SELECT 
        r.id AS roomId,
        u.name AS userName,
        u.id AS userId
    FROM 
        ${chatTableName} c1
    JOIN 
        ${roomTableName} r ON c1.roomId = r.id
    JOIN 
        "${userTableName}" u ON c1.userId = u.id
    WHERE 
        r.id = ? AND u.id != ? ;
  `;

    db.all(query, [roomId, userToIgnore], (err, rows: RoomMember[]) => {
      if (err) {
        return reject(err);
      }
      return resolve(rows);
    });
  });
}

/**
 * Gets all rooms a user is part of, as well as evey member in those rooms.
 * @param db {sqlite3.Database}
 * @param userId {string}
 * @param chatTableName? {string}
 * @param roomTableName? {string}
 * @param userTableName? {string}
 * @returns
 */
function selectAllRoomsAndRoomMembersByUserId(db: sqlite3.Database, userId: string, chatTableName = "chat", roomTableName = "room", userTableName = "user"): Promise<RoomWithMembers[]> {
  interface Row {
    // Shape of returned row for the specific query below...
    roomId: string;
    roomName: string;
    userId: string;
    userName: string;
    userEmail: string;
  }

  return new Promise((resolve, reject) => {
    const query = `
  SELECT 
      r.id AS roomId,
      r.name AS roomName,
      u.id AS userId,
      u.name AS userName,
      u.email AS userEmail
  FROM 
      ${chatTableName} c1
  JOIN 
      ${roomTableName} r ON c1.roomId = r.id
  JOIN 
      ${chatTableName} c2 ON c1.roomId = c2.roomId
  JOIN 
      "${userTableName}" u ON c2.userId = u.id
  WHERE 
      c1.userId = ?
  ORDER BY roomName ASC;
`;

    // Execute the query
    db.all(query, [userId], (err: Error, rows: Row[]) => {
      if (err) {
        console.error("Error running query:", err);
        return reject(err);
      }

      const result = rows.reduce((acc: RoomWithMembers[], row: Row) => {
        let room = acc.find((r) => r.id === row.roomId);
        if (!room) {
          room = { id: row.roomId, name: row.roomName, members: [] };
          acc.push(room);
        }
        room.members.push({ id: "", name: row.userName, email: row.userEmail });
        return acc;
      }, [] as RoomWithMembers[]);

      return resolve(result);
    });
  });
}

function insertUserByIdToRoomById(db: sqlite3.Database, userId: string, roomId: string, tableName = "chat") {
  return new Promise((resolve, reject) => {
    try {
      const query = `INSERT INTO ${tableName} (userId, roomId) VALUES (?, ?)`;

      db.run(query, [userId, roomId], (err) => {
        if (err) {
          return reject(err);
        }
        return resolve({ userId, roomId });
      });
    } catch (e) {
      return reject(e);
    }
  });
}
