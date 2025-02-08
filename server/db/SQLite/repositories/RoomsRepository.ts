import { v7 as uuidV7 } from "uuid";
import sqlite3 from "sqlite3";
import { DatabasePool, RoomsRepository } from "@server/types";
import { PublicUser, Room, PublicMember, ChatScopeWithMembers } from "@root/types.shared";

export default class RoomsRepositorySQLite implements RoomsRepository<sqlite3.Database> {
  databasePool: DatabasePool<sqlite3.Database>;

  constructor(dbpool: DatabasePool<sqlite3.Database>) {
    this.databasePool = dbpool;
  }

  async addUserToRoom(userId: string, roomId: string): Promise<boolean> {
    const { db, release } = await this.databasePool.getConnection();
    return new Promise((resolve, reject) => {
      try {
        const query = `INSERT INTO chat (userId, roomId) VALUES (?, ?)`;
        db.run(query, [userId, roomId], async (err) => {
          if (err) {
            release();
            return reject(err);
          }
          release();
          return resolve(true);
        });
      } catch (e) {
        release();
        return reject(e);
      }
    });
  }

  async removeUserFromRoom(userId: string, roomId: string): Promise<boolean> {
    const { db, release } = await this.databasePool.getConnection();
    return new Promise((resolve, reject) => {
      try {
        db.serialize(() => {
          db.run(`DELETE FROM chat WHERE roomId = ? AND userId = ?`, [roomId, userId], function (err) {
            if (err) {
              release();
              return reject(err);
            }
            release();
            return resolve(true);
          });
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  async selectUnjoinedRooms(userId: string): Promise<Room[]> {
    const { db, release } = await this.databasePool.getConnection();
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
          release();
          return reject(err);
        }
        release();
        return resolve(rows);
      });
    });
  }

  async selectRoomsWithMembersByUserId(userId: string): Promise<ChatScopeWithMembers[]> {
    interface Row {
      // Shape of returned row for the specific query below...
      roomId: string;
      roomName: string;
      userId: string;
      userName: string;
      userEmail: string;
    }

    const { db, release } = await this.databasePool.getConnection();

    return new Promise((resolve, reject) => {
      try {
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
            release();
            return reject(err);
          }

          const result = rows.reduce((acc: ChatScopeWithMembers[], row: Row) => {
            let room = acc.find((r) => r.id === row.roomId);
            if (!room) {
              room = { id: row.roomId, userId: row.userId, type: "Room", scopeName: row.roomName, members: [] };
              acc.push(room);
            }
            room.members.push({ userId: row.userId, scopeId: row.roomId, userName: row.userName, isActive: false });
            return acc;
          }, [] as ChatScopeWithMembers[]);

          release();
          return resolve(result);
        });
      } catch (e) {
        release();
        reject(e);
      }
    });
  }

  async selectRoomMembersExcludingUser(roomId: string, excludingUserId: string): Promise<PublicMember[]> {
    const { db, release } = await this.databasePool.getConnection();
    return new Promise((resolve, reject) => {
      const query = `
      SELECT
          r.id AS roomId,
          u.name AS userName,
          u.id AS userId,
          dc.id AS scopeId
      FROM
          chat c
      JOIN 
          room r 
      ON
          c.roomId = r.id
      JOIN 
          "user" u 
      ON
          c.userId = u.id
      LEFT JOIN 
          direct_conversation dc
      ON 
          (dc.userA_Id = u.id AND dc.userB_Id = ?)
          OR
          (dc.userB_Id = u.id AND dc.userA_Id = ?)
      WHERE
          r.id = ?
      AND 
          u.id != ?
      ORDER BY
          u.name ASC;
    `;

      db.all(query, [excludingUserId, excludingUserId, roomId, excludingUserId], (err, rows: PublicMember[]) => {
        if (err) {
          release();
          return reject(err);
        }
        release();
        return resolve(rows);
      });
    });
  }

  async selectRoomMembersByRoomId(roomId: string): Promise<PublicUser[]> {
    const { db, release } = await this.databasePool.getConnection();
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

      db.all(query, [roomId], (err, rows: PublicUser[]) => {
        if (err) {
          release();
          return reject(err);
        }
        release();
        return resolve(rows);
      });
    });
  }

  async getAll(): Promise<Room[]> {
    const { db, release } = await this.databasePool.getConnection();
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM room ORDER BY name ASC`, [], (err, rows: Room[]) => {
        if (err) {
          release();
          return reject(err);
        }
        release();
        return resolve(rows);
      });
    });
  }

  async getById(id: string): Promise<Room> {
    const { db, release } = await this.databasePool.getConnection();
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM room WHERE id = ?`, [id], (err, row: Room) => {
        if (err) {
          release();
          return reject(err);
        }
        release();
        return resolve(row);
      });
    });
  }

  async create(name: string, isPrivate?: 0 | 1): Promise<Room> {
    const { db, release } = await this.databasePool.getConnection();
    const privateStatus: 0 | 1 = isPrivate === undefined ? 0 : isPrivate; // default to public
    const entity: Room = { id: uuidV7(), name, isPrivate: privateStatus };

    return new Promise(async (resolve, reject) => {
      try {
        const query = `INSERT INTO room (id, name, isPrivate) VALUES (?, ?, ?)`;
        db.run(query, [entity.id, entity.name, privateStatus], (err) => {
          if (err) {
            release();
            return reject(err);
          }
          release();
          return resolve(entity);
        });
      } catch (e) {
        release();
        return reject(e);
      }
    });
  }

  async selectByUserId(userId: string): Promise<Room[]> {
    const { db, release } = await this.databasePool.getConnection();
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
          release();
          return reject(err);
        }
        release();
        return resolve(rows);
      });
    });
  }

  update(_id: string, _entity: Room): Promise<Room | null> {
    throw new Error("Method not implemented.");
  }

  delete(_id: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
}
