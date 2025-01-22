import "dotenv/config";
import nodeFs from "node:fs";
import nodePath from "node:path";
import WebSocketApp from "./server/wss/WebSocketApp";
import initDatabase from "./scripts/initDatabase";
import { generateFakeData, insertFakeData } from "./scripts/fakeData";
import { defineConfig } from "cypress";
import sqlite3 from "sqlite3";
sqlite3.verbose();

const DATABASE_PATH = nodePath.resolve(__dirname, "./cypress/db/test.db");

export default defineConfig({
  projectId: "t5349w",
  e2e: {
    baseUrl: `http://localhost:${process.env.EXPRESS_PORT}`,
    experimentalInteractiveRunEvents: true,
    setupNodeEvents(on, config) {
      on("before:run", async () => {
        await setupTestDatabase(DATABASE_PATH);
      });
      on("after:run", () => {
        //cleanupTestDatabase(DATABASE_PATH);
      });
      return config;
    },
  },
});

async function setupTestDatabase(dbPath: string): Promise<boolean> {
  return new Promise(async (resolve, reject) => {
    try {
      // If db exists (bc `on("after:run")` is buggy and doesn't work right with `cypress open`), remove it.
      cleanupTestDatabase(dbPath);
      await initDatabase(dbPath);

      const fakeData = generateFakeData({
        userParams: {
          numberOfUsers: 5,
          makeIdentical: true,
        },
        chatRoomsParams: {
          numberOfRooms: 5,
          longNameFrequency: 3,
        },
        chatRoomsWithMembersParams: {
          minUsersPerRoom: 2,
          maxUsersPerRoom: 4,
        },
        chatRoomMessagesParams: {
          maxMessagesPerRoom: 5,
          minMessageLength: 3,
          maxMessageLength: 20,
        },
        directConversationParams: {
          minConversationsPerUser: 1,
          maxConversationsPerUser: 3,
        },
        directMessagesParams: {
          minMessagesPerConversation: 1,
          maxMessagesPerConversation: 3,
          minMessageLength: 3,
          maxMessageLength: 20,
        },
      });

      // Add #general Room and add everyone to it
      const generalRoom = {
        name: "#general",
        id: WebSocketApp.ID_UNASSIGNED,
        isPrivate: 0,
      };
      fakeData.rooms.push(generalRoom);
      fakeData.roomsWithMembers.push({
        room: generalRoom,
        members: fakeData.users,
      });

      const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error(`Error getting database handle : ${err.message}`);
          return reject(err);
        }
      });

      await insertFakeData(db, fakeData);
      resolve(true);
    } catch (e) {
      reject(e);
    }
  });
}

function cleanupTestDatabase(dbPath: string) {
  if (nodeFs.existsSync(dbPath)) {
    nodeFs.unlinkSync(dbPath);
  }
}
