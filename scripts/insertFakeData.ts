/**
 *
 *
 * You can use `npm run insert:fake:data` to run this..
 *
 *
 */
import sqlite3 from "sqlite3";
import nodePath from "node:path";
// prettier-ignore
import {
  generateFakeUsers,
  generateFakeChatRooms,
  addFakeUsersToFakeChatRooms,
  generateFakeChatRoomMessages,
  generateFakeDirectConversations,
  generateFakeDirectMessages,
  insertFakeUsers,
  insertFakeChatRooms,
  insertFakeUsersIntoFakeChatRooms,
  insertFakeChatRoomMessages,
  insertFakeDirectConversations,
  insertFakeDirectMessages,
} from "./fakeData";
import initDatabase from "./initDatabase";
import WebSocketApp from "@/server/wss/WebSocketApp";

/**
 *
 * Variables for Generating/Inserting Data
 *
 */

const NUM_ITEMS = 100;
const DATABASE_PATH = nodePath.resolve(__dirname, "../server/db/rtchat.db");

/**
 *
 * Generate Data
 *
 */

console.log(`\n${"~".repeat(60)}\nGenerating Data\n${"~".repeat(60)}\n`);

console.log(`- Generating Users`);
const users = generateFakeUsers(NUM_ITEMS, true);
console.log(`- Generating Rooms`);
const rooms = generateFakeChatRooms(NUM_ITEMS, 4);
console.log(`- Adding Users to Rooms`);
const roomsWithMembers = addFakeUsersToFakeChatRooms(users, rooms, 2, NUM_ITEMS);
console.log(`- Generating Chat Room Messages`);
const chatRoomMessages = generateFakeChatRoomMessages(roomsWithMembers, 50, 3, 20);
console.log(`- Generating Direct Conversations`);
const directConversations = generateFakeDirectConversations(users, 2, 3);
console.log(`- Generating Direct Messages for each Direct Conversation`);
const directMessages = generateFakeDirectMessages(directConversations, 5, 20, 3, 20);

/**
 *
 * Validate Data
 *
 */

let HAS_ERRORS = false;
console.log(`\n${"~".repeat(60)}\nValidating Generated Data\n${"~".repeat(60)}\n`);

console.log(`- Checking for duplicate users in any room`);
let duplicate = null;
// Check no duplicate users added to room
for (let i = 0; i < roomsWithMembers.length; i++) {
  if (duplicate !== null) {
    break;
  }
  const room = roomsWithMembers[i];
  const roomSet = new Set(room.members.map((m) => m.id));
  if (roomSet.size !== room.members.length) {
    duplicate = room;
  }
}
if (duplicate === null) {
  console.log(` - [SUCCESS] No duplicate users found`);
} else {
  console.error(` - [ERROR] Duplicate user in room : '${duplicate.room.name}'`);
  HAS_ERRORS = true;
}

console.log(`- Checking that every user was added to a room.`);
// Check if every user was added to a room
const _usersThatAreInRooms = new Set();
for (let i = 0; i < roomsWithMembers.length; i++) {
  _usersThatAreInRooms.add(roomsWithMembers[i].members);
}
if (_usersThatAreInRooms.size !== NUM_ITEMS) {
  console.error(` - [ERROR] There were ${NUM_ITEMS - _usersThatAreInRooms.size} users not added to rooms.`);
  HAS_ERRORS = true;
} else {
  console.log(` - [SUCCESS] All users were added to at least 1 room`);
}

console.log(`- Checking there are no duplicate direct conversations`);
let foundDuplicateDirectConvo = false;
for (let i = 0; i < users.length; i++) {
  const user = users[i];
  const directConvos = directConversations.filter((dc) => dc.userA.id === user.id || dc.userB.id === user.id);

  for (let j = 0; j < directConvos.length; j++) {
    const convo = directConvos[j];

    const duplicateDirectConvos = directConvos.filter((dc) => {
      if (dc.userA.id === convo.userB.id && dc.userB.id === convo.userA.id) {
        return dc;
      }
    });

    if (duplicateDirectConvos.length > 0) {
      foundDuplicateDirectConvo = true;
      break;
    }
  }

  if (foundDuplicateDirectConvo) {
    break;
  }
}
if (foundDuplicateDirectConvo) {
  console.log(` - [ERROR] Found duplicate Direct Conversation!`);
  HAS_ERRORS = true;
} else {
  console.log(` - [SUCCESS] No duplicate Direct Conversations found`);
}

console.log("- Checking a user is not in a direct conversation with themselves");
let isInDirectConvoWithSelf = null;
for (let i = 0; i < directConversations.length; i++) {
  const dc = directConversations[i];
  if (dc.userA.id === dc.userB.id) {
    isInDirectConvoWithSelf = dc.userA;
    break;
  }
}
if (isInDirectConvoWithSelf === null) {
  console.log(` - [SUCCESS] No self Direct Conversations found`);
} else {
  console.log(` - [ERROR] User '${isInDirectConvoWithSelf}' is in a Direct Conversation with themselves`);
  HAS_ERRORS = true;
}

/**
 *
 * Insert data
 *
 */

console.log();

// Add #general Room and add everyone to it
const generalRoom: FakeChatRoom = {
  name: "#general",
  id: WebSocketApp.ID_UNASSIGNED,
  isPrivate: 0,
};
rooms.push(generalRoom);
roomsWithMembers.push({
  room: generalRoom,
  members: users,
});

if (HAS_ERRORS) {
  console.log(`\n${"~".repeat(60)}\nERRORS FOUND\nSince errors were found, we will not be adding data to database.\nExiting script now!\n${"~".repeat(60)}\n`);
  process.exit(1);
} else {
  console.log(`\n${"~".repeat(60)}\nNo errors found with generated data.\n${"~".repeat(60)}\n`);
}

(async () => {
  await initDatabase(DATABASE_PATH);

  const db = new sqlite3.Database(DATABASE_PATH, (err) => {
    if (err) {
      console.error(`Error connecting to the database:`, err);
      process.exit(1);
    }
  });

  try {
    db.serialize(async () => {
      console.log(`\n${"~".repeat(60)}\nInserting Started!\nInserting '${NUM_ITEMS}' items into database located at '${DATABASE_PATH}'. \n${"~".repeat(60)}\n`);
      db.run("BEGIN TRANSACTION");

      console.log("- Inserting Users");
      await insertFakeUsers(db, users);
      console.log(" - Users inserted");

      console.log("- Inserting Chat Rooms");
      await insertFakeChatRooms(db, rooms);
      console.log(" - Chat Rooms inserted");

      console.log("- Adding Users into Chat Rooms");
      await insertFakeUsersIntoFakeChatRooms(db, roomsWithMembers);
      console.log(" - Users added into Chat Rooms");

      console.log("- Inserting Chat Room Messages");
      await insertFakeChatRoomMessages(db, chatRoomMessages);
      console.log(" - Chat Room Messages inserted");

      console.log("- Inserting Direct Conversations");
      await insertFakeDirectConversations(db, directConversations);
      console.log(" - Direct Conversations inserted");

      console.log("- Inserting Direct Messages");
      await insertFakeDirectMessages(db, directMessages);
      console.log(" - Direct Messages inserted");

      db.run("COMMIT");
      console.log(`\n${"~".repeat(60)}\n Inserting Finished! \n${"~".repeat(60)}\n`);
    });
  } catch (e) {
    db.run("ROLLBACK");
    console.error("Transaction rolled back due to error:", e);
  }
})();
