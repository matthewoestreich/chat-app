import sqlite3 from "sqlite3";
import path from "path";
import { v7 as uuidv7 } from "uuid";

sqlite3.verbose();

const ROOMS = [
	{
		id: uuidv7(),
		name: "society",
	},
	{
		id: uuidv7(),
		name: "percent",
	},
	{
		id: uuidv7(),
		name: "empire",
	},
	{
		id: uuidv7(),
		name: "improve",
	},
];

const USERS = [
  "Ashton Wise", "Charlie Horne", "Brian Ashley", "Hadley Silva", "Simone Washington", 
  "Rex Shaffer", "Blaire Macdonald", "Colter Ayers", "Kaitlyn Cannon", "Peyton Clarke"
].map((name) => ({ name, id: uuidv7() }));

/*
const db = new sqlite3.Database(path.resolve(import.meta.dirname, "./rtchat.db"), (err) => {
	if (err) {
		console.error("Error opening database", err);
	} else {
		console.log("Connected to the SQLite database.");
	}
});
*/

/*
const insertUserStatement = db.prepare("INSERT OR IGNORE INTO user (id, name) VALUES (?, ?)");
USERS.forEach(user => {
  insertUserStatement.run(user.id, user.name);
});
insertUserStatement.finalize(err => {
  if (err) {
    console.log("error inserting user into users", {err});
  }
});
*/

/*
const insertRoomStatement = db.prepare("INSERT OR IGNORE INTO room (id, name) VALUES (?, ?)");
ROOMS.forEach(room => {
  insertRoomStatement.run(room.id, room.name);
});
insertRoomStatement.finalize(err => {
  if (err) {
    console.log("error inserting room into rooms!", {err});
  }
});
*/

/*
const insertUsersIntoRoomsStatement = db.prepare("INSERT INTO chat (userId, roomId) VALUES (?, ?)");
USERS.forEach(user => {
  const randomRoom = ROOMS[Math.floor(Math.random() * ROOMS.length)];
  insertUsersIntoRoomsStatement.run(user.id, randomRoom.id);
});
insertUsersIntoRoomsStatement.finalize(err => {
  if (err) {
    console.log(`error adding user to room`, err);
  } else {
    console.log(`SUCCESS adding users into rooms`);
  }
});
*/

const getAllRoomsWithMembersStatement = db.prepare(`
  SELECT room.name AS room_name, user.name AS user_name
  FROM room
  JOIN chat ON room.id = chat.roomId
  JOIN user ON chat.userId = user.id
  ORDER BY room.name, user.name
`);
getAllRoomsWithMembersStatement.all((err, rows) => {
  if (err !== null) {
    console.log(`error getting room members`, err);
  } else {
    rows.forEach(row => console.log(`Member '${row.user_name}' is in room '${row.room_name}'`));
  }
  getAllRoomsWithMembersStatement.finalize();
  db.close();
});
