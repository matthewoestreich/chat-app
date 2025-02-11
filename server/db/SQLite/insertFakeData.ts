import sqlite3 from "sqlite3";
import bcrypt from "bcrypt";
import { v7 as uuidV7 } from "uuid";
import { FakeData, FakeUser, FakeChatRoom, FakeDirectMessage, FakeChatRoomMessage, FakeChatRoomWithMembers, FakeDirectConversation } from "@server/types";
import tableNames from "../tableNames";

/**
 * =================================
 * INSERT FAKE DATA FUNCTIONS
 * =================================
 */

/**
 * Insert fake data.
 * @param db
 * @param fakeData
 */
export async function insertFakeData(db: sqlite3.Database, fakeData: FakeData): Promise<boolean> {
  return new Promise((resolve, reject) => {
    try {
      db.serialize(async () => {
        await insertFakeUsers(db, fakeData.users);
        await insertFakeChatRooms(db, fakeData.rooms);
        await insertFakeUsersIntoFakeChatRooms(db, fakeData.roomsWithMembers);
        await insertFakeChatRoomMessages(db, fakeData.chatRoomMessages);
        await insertFakeDirectConversations(db, fakeData.directConversations);
        await insertFakeDirectConversationMemberships(db, fakeData.directConversations);
        await insertFakeDirectMessages(db, fakeData.directMessages);
        db.run("COMMIT", (_results: sqlite3.RunResult, err: Error | null) => {
          if (err) {
            return reject(err);
          }
          return resolve(true);
        });
      });
    } catch (e) {
      db.run("ROLLBACK", (_results: sqlite3.RunResult, err: Error | null) => {
        if (err) {
          return reject(`Transaction rolled back due to error. Got error during ROLLBACK: ${err.message}`);
        }
        return reject(`Transaction rolled back due to error: ${(e as Error).message}`);
      });
    }
  });
}

/**
 * Insert users into database
 * @param db
 * @param users
 */
export async function insertFakeUsers(db: sqlite3.Database, users: FakeUser[]): Promise<boolean> {
  return new Promise(async (resolve, reject) => {
    try {
      const stmt = db.prepare(`INSERT INTO ${tableNames.users} (id, user_name, email, password) VALUES (?, ?, ?, ?)`);
      for (const user of users) {
        const salt = await bcrypt.genSalt(10);
        const pw = await bcrypt.hash(user.password, salt);
        stmt.run(user.id, user.username, user.email, pw);
      }
      stmt.finalize((err) => {
        if (err) {
          return reject(err);
        }
        resolve(true);
      });
    } catch (e) {
      reject(`error inserting ${tableNames.users} ${e}`);
    }
  });
}

/**
 * Insert chat rooms into database.
 * @param db
 * @param rooms
 */
export async function insertFakeChatRooms(db: sqlite3.Database, rooms: FakeChatRoom[]): Promise<boolean> {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare(`INSERT INTO ${tableNames.rooms} (id, name, isPrivate) VALUES (?, ?, ?)`);
      for (const room of rooms) {
        stmt.run(room.id, room.name, room.isPrivate);
      }
      stmt.finalize((err) => {
        if (err) {
          return reject(err);
        }
        resolve(true);
      });
    } catch (e) {
      reject(`error inserting ${tableNames.rooms} ${e}`);
    }
  });
}

/**
 * Set room memberships
 * @param db
 * @param roomsWithMembers
 */
export async function insertFakeUsersIntoFakeChatRooms(db: sqlite3.Database, roomsWithMembers: FakeChatRoomWithMembers[]): Promise<boolean> {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare(`INSERT INTO ${tableNames.roomMemberships} (userId, roomId) VALUES (?, ?)`);
      for (const { room, members } of roomsWithMembers) {
        for (const member of members) {
          stmt.run(member.id, room.id);
        }
      }
      stmt.finalize((err) => {
        if (err) {
          return reject(err);
        }
        resolve(true);
      });
    } catch (e) {
      reject(`error joining users to chat rooms ${e}`);
    }
  });
}

/**
 * Insert chat room messages into database.
 * @param db
 * @param messages
 */
export async function insertFakeChatRoomMessages(db: sqlite3.Database, messages: FakeChatRoomMessage[]): Promise<boolean> {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare(`INSERT INTO ${tableNames.roomMessages} (id, roomId, userId, message) VALUES (?, ?, ?, ?)`);
      for (const message of messages) {
        stmt.run(message.id, message.room.id, message.user.id, message.message);
      }
      stmt.finalize((err) => {
        if (err) {
          return reject(err);
        }
        resolve(true);
      });
    } catch (e) {
      reject(`error inserting ${tableNames.roomMessages} ${e}`);
    }
  });
}

/**
 * Insert Direct Conversations into database.
 * @param db
 * @param convos
 */
export async function insertFakeDirectConversations(db: sqlite3.Database, convos: FakeDirectConversation[]): Promise<boolean> {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare(`INSERT INTO ${tableNames.directConversations} (id, userAId, userBId) VALUES (?, ?, ?)`);
      for (const convo of convos) {
        stmt.run(convo.id, convo.userA.id, convo.userB.id);
      }
      stmt.finalize((err) => {
        if (err) {
          return reject(err);
        }
        resolve(true);
      });
    } catch (e) {
      reject(`error inserting ${tableNames.directConversations} ${e}`);
    }
  });
}

/**
 * Insert memberships for direct conversations
 * @param db
 * @param convos
 * @returns
 */
export async function insertFakeDirectConversationMemberships(db: sqlite3.Database, convos: FakeDirectConversation[]): Promise<boolean> {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare(`
        INSERT INTO ${tableNames.directConversationMemberships} (id, directConversationId, userId, isMember) VALUES (?, ?, ?, ?)
      `);
      for (const convo of convos) {
        stmt.run(uuidV7(), convo.id, convo.userA.id, true);
        stmt.run(uuidV7(), convo.id, convo.userB.id, true);
      }
      stmt.finalize((err) => {
        if (err) {
          return reject(err);
        }
        resolve(true);
      });
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Insert direct messages into database.
 * @param db
 * @param messages
 */
export async function insertFakeDirectMessages(db: sqlite3.Database, messages: FakeDirectMessage[]): Promise<boolean> {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare(`INSERT INTO ${tableNames.directMessages} (id, directConversationId, fromUserId, toUserId, message, isRead) VALUES (?, ?, ?, ?, ?, ?)`);
      for (const message of messages) {
        stmt.run(message.id, message.directConversation.id, message.from.id, message.to.id, message.message, message.isRead);
      }
      stmt.finalize((err) => {
        if (err) {
          return reject(err);
        }
        resolve(true);
      });
    } catch (e) {
      reject(`error inserting ${tableNames.directMessages} ${e}`);
    }
  });
}
