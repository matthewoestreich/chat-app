import sqlite3 from "sqlite3";
import { roomService } from ".";
sqlite3.verbose();

export default {
  selectRoomsByUserId: selectAllRoomsByUserId,
  addUserByIdToRoomById: insertUserByIdToRoomById,
  selectAllRoomsAndMembersByUserId: selectAllRoomsAndRoomMembersByUserId,
  selectRoomMembersByRoomId: selectRoomMembersByRoomId,
  selectRoomMembersExcludingUser,
  deleteRoomMember,
};

function selectAllRoomsByUserId(db: sqlite3.Database, userId: string): Promise<Room[]> {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT r.id, r.name
      FROM room r
      JOIN chat c ON r.id = c.roomId
      WHERE c.userId = ?
      ORDER BY r.name ASC
    `;

    db.all(query, [userId], (err, rows: Room[]) => {
      if (err) {
        return reject(err);
      }
      return resolve(rows);
    });
  });
}

function selectRoomMembersByRoomId(db: sqlite3.Database, roomId: string): Promise<RoomMember[]> {
  return new Promise((resolve, reject) => {
    const query = `
    SELECT 
        r.id AS roomId,
        u.name AS userName,
        u.id AS userId
    FROM 
        chat c1
    JOIN 
        room r ON c1.roomId = r.id
    JOIN 
        "user" u ON c1.userId = u.id
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
function selectRoomMembersExcludingUser(db: sqlite3.Database, roomId: string, excludingUserId: string): Promise<RoomMember[]> {
  return new Promise((resolve, reject) => {
    const query = `
    SELECT 
        r.id AS roomId,
        u.name AS userName,
        u.id AS userId
    FROM 
        chat c1
    JOIN 
        room r ON c1.roomId = r.id
    JOIN 
        "user" u ON c1.userId = u.id
    WHERE 
        r.id = ? AND u.id != ? ;
  `;

    db.all(query, [roomId, excludingUserId], (err, rows: RoomMember[]) => {
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
function selectAllRoomsAndRoomMembersByUserId(db: sqlite3.Database, userId: string): Promise<RoomWithMembers[]> {
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
      chat c1
  JOIN 
      room r ON c1.roomId = r.id
  JOIN 
      chat c2 ON c1.roomId = c2.roomId
  JOIN 
      "user" u ON c2.userId = u.id
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

function insertUserByIdToRoomById(db: sqlite3.Database, userId: string, roomId: string, returnAllUserRoomsAfterInsert = false): Promise<Room[] | Room> {
  return new Promise((resolve, reject) => {
    try {
      const query = `INSERT INTO chat (userId, roomId) VALUES (?, ?)`;

      db.run(query, [userId, roomId], async (err) => {
        if (err) {
          return reject(err);
        }
        if (returnAllUserRoomsAfterInsert) {
          const rooms = await selectAllRoomsByUserId(db, userId);
          return resolve(rooms);
        }
        const room = await roomService.selectById(db, roomId);
        return resolve(room);
      });
    } catch (e) {
      return reject(e);
    }
  });
}

function deleteRoomMember(db: sqlite3.Database, roomId: string, userId: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    try {
      db.serialize(() => {
        db.run(`DELETE FROM chat WHERE roomId = ? AND userId = ?`, [roomId, userId], function (err) {
          if (err) {
            return reject(err);
          }
          return resolve(true);
        });
      });
    } catch (e) {
      console.log(`[chatService][deleteRoomMember][ERROR]`, e);
      reject(e);
    }
  });
}
