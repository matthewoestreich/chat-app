// @ts-nocheck
import path from "path";
import sqlite3 from "sqlite3";
import bcrypt from "bcrypt";
import { v7 as uuidV7 } from "uuid";
import { accountService, roomService, chatService } from "@/server/db/services";
sqlite3.verbose();

const db = new sqlite3.Database(path.resolve(__dirname, "./rtchat.db"), (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
});

const roomIds = ["019327c9-0dc2-720c-b1e7-25cc5a3175c9", "019327c9-0dc4-7383-a9e4-7998b572b582", "019327c9-0dc4-7383-a9e4-83bf2c493e20", "019327c9-0dc4-7383-a9e4-7f14b8e0cb2a", "019327f9-0290-740f-a89e-205f4c265a43", "019327f9-0293-7142-bac9-5f73ba18bd25", "019327f9-0294-71dc-8f08-34806b3ec09a", "019327f9-0294-71dc-8f08-3920a8c3819a"];

const users = ["Wes", "Luke", "Mary", "helloWorld", "chatter", "Kathy", "Bo", "Marcus", "Amy"];

// insertUsers(db, users).catch(e => console.error(e));
//joinUsersToRooms(db, users).catch(e => console.error(e));

async function insertUsers(db, userNames = []) {
  const users = [];
  for (const un of userNames) {
    const salt = await bcrypt.genSalt(10);
    const pw = await bcrypt.hash(`${un}123`, salt);
    users.push({ id: uuidV7(), name: un, password: pw, email: `${un}@${un}.com` });
  }

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    const stmt = db.prepare('INSERT INTO "user" (id, name, password, email) VALUES (?, ?, ?, ?)');

    users.forEach((user) => {
      stmt.run(user.id, user.name, user.password, user.email);
    });

    stmt.finalize();

    db.run("COMMIT", (err) => {
      if (err) {
        console.error("Transaction failed", err.message);
      } else {
        console.log("Transaction committed");
      }
    });
  });

  db.close();
}

async function joinUsersToRooms(db, users = []) {
  const foundUsers = [];
  try {
    for (const user of users) {
      const email = `${user}@${user}.com`;
      const found = await accountService.selectByEmail(db, email);
      if (found && found.email === email) {
        //const existing = users.find(u => found.email === email);
        const randomRoomId = roomIds[Math.floor(Math.random() * roomIds.length)];
        foundUsers.push({ userId: found.id, roomId: randomRoomId });
      }
    }
  } catch (e) {
    console.log(`error finding users`, e);
    db.close();
    process.exit(1);
  }

  if (!foundUsers.length) {
    console.error(`didn't match any new users with existing`);
    db.close();
    process.exit(1);
  }

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    const stmt = db.prepare("INSERT INTO chat (userId, roomId) VALUES (?, ?)");

    foundUsers.forEach((user) => {
      stmt.run(user.userId, user.roomId);
    });

    stmt.finalize();

    db.run("COMMIT", (err) => {
      if (err) {
        console.error("Transaction failed", err.message);
      } else {
        console.log("Transaction committed");
      }
    });
  });

  db.close();
}
