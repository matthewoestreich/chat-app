/**
 *
 *
 *
 *
 *
 *
 *
 * You can use `npm run insert:fake:data` to run this..
 *
 *
 *
 *
 *
 *
 */
import { faker } from "@faker-js/faker";
import { v7 as uuidV7 } from "uuid";
import bcrypt from "bcrypt";
import sqlite3 from "sqlite3";
import path from "path";
sqlite3.verbose();

const NUM_ITEMS_EACH = 100;

function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

function getRandomArrayElement(arr: any = []) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomIntsFromUUID(uuid: string) {
  let uuidArr = uuid.replace("-", "").split("");
  let found = [];
  while (uuidArr.length && found.length < 2) {
    const curr = parseInt(uuidArr.pop() || "A");
    if (!isNaN(curr)) {
      found.push(curr);
    }
  }
  return found;
}

interface ChatRoomMember {
  id: string;
  username: string;
  password: string;
  email: string;
  rooms: { name: string; id: string; isPrivate: number }[];
}

// Generate fake user data
const users: any[] = Array.from({ length: NUM_ITEMS_EACH }, () => {
  const username = faker.internet.username();
  const user = {
    username,
    password: username,
    email: `${username}@${username}.com`,
    id: uuidV7(),
  };
  return user;
});

// Generate fake room data
const rooms: any[] = Array.from({ length: NUM_ITEMS_EACH }, (_, i) => {
  const isPrivate = getRandomArrayElement([0, 1]);
  if (i % 3 === 0) {
    return { name: `${faker.word.adjective()} ${faker.word.noun()}`, id: uuidV7(), isPrivate };
  }
  return { name: faker.word.noun(), id: uuidV7(), isPrivate };
});

// Add users to rooms randomly
const chat = Array.from({ length: NUM_ITEMS_EACH }, (_, i) => {
  const output = { ...users[i], rooms: [] as any[] };
  const randInts = getRandomIntsFromUUID(uuidV7());
  const randomIndex = getRandomInt(randInts.length);
  let ceil = randInts[randomIndex];
  if (ceil === 0) {
    ceil = 4;
  }
  const existing: any[] = [];
  for (let i = 0; i < ceil * 3; i++) {
    const room = getRandomArrayElement(rooms);
    if (!existing.includes(room.id)) {
      output.rooms.push(room);
    }
    existing.push(room.id);
  }
  return output;
});

async function insertUsers(db: sqlite3.Database, users: { id: string; username: string; password: string; email: string }[]) {
  return new Promise(async (resolve, reject) => {
    try {
      const stmt = db.prepare(`INSERT INTO "user" (id, name, email, password) VALUES (?, ?, ?, ?)`);
      for (const user of users) {
        const salt = await bcrypt.genSalt(10);
        const pw = await bcrypt.hash(user.password, salt);
        stmt.run(user.id, user.username, user.email, pw);
      }
      stmt.finalize(() => {
        console.log(" - users stmt finalized");
      });
      resolve(true);
    } catch (e) {
      reject(`error inserting users ${e}`);
    }
  });
}

async function insertRooms(db: sqlite3.Database, rooms: { name: string; id: string; isPrivate: number }[]) {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare(`INSERT INTO room (id, name, isPrivate) VALUES (?, ?, ?)`);
      for (const room of rooms) {
        stmt.run(room.id, room.name, room.isPrivate);
      }
      stmt.finalize(() => {
        console.log(" - rooms stmt finalized");
      });
      resolve(true);
    } catch (e) {
      reject(`error inserting rooms ${e}`);
    }
  });
}

async function insertChatRooms(db: sqlite3.Database, members: ChatRoomMember[]) {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare(`INSERT INTO chat (userId, roomId) VALUES (?, ?)`);
      for (const user of members) {
        for (const room of user.rooms) {
          stmt.run(user.id, room.id);
        }
      }
      stmt.finalize(() => {
        console.log(" - chat rooms stmt finalized");
      });
      resolve(true);
    } catch (e) {
      reject(`error inserting chat rooms ${e}`);
    }
  });
}

async function main() {
  const db = new sqlite3.Database(path.resolve(__dirname, "./rtchat.db"), (err) => {
    if (err) {
      console.error(`Error connecting to the database:`, err);
      process.exit(1);
    }
  });

  try {
    db.serialize(async () => {
      db.run("BEGIN TRANSACTION");

      console.log("Inserting users...");
      await insertUsers(db, users);
      console.log("users inserted");

      console.log("Inserting rooms...");
      await insertRooms(db, rooms);
      console.log("rooms inserted");

      console.log("Inserting chat rooms...");
      await insertChatRooms(db, chat);
      console.log("chat rooms inserted.");

      db.run("COMMIT");
    });
  } catch (e) {
    db.run("ROLLBACK");
    console.error("Transaction rolled back due to error:", e);
  } finally {
    console.log("done");
  }
}

/**
 *
 * COMMENT THIS OUT TO SKIP RUNNING
 */
(async () => main())();
/*
 */
