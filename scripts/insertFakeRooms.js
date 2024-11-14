import path from "path";
import { v7 as uuidV7 } from "uuid";
import { roomService } from "#@/db/services/index.js";
import sqlite3 from "sqlite3";
sqlite3.verbose();

const rooms = ["general", "sports", "pearl's random room", "no name"];

const db = new sqlite3.Database(path.resolve(import.meta.dirname, "../db/rtchat.db"));
Promise.allSettled(rooms.map((room) => roomService.insert(db, room, uuidV7())))
  .then((results) => {
    console.log({ results });
  })
  .catch((err) => {
    console.log(`encountered error creating rooms`, err);
  });
