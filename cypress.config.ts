import "dotenv/config";
import nodeFs from "node:fs";
import nodePath from "node:path";
import WebSocketApp from "./server/wss/WebSocketApp";
import { generateFakeData, insertFakeData } from "./scripts/fakeData";
import { defineConfig } from "cypress";
import sqlite3 from "sqlite3";
sqlite3.verbose();

process.env.ABSOLUTE_DB_PATH = nodePath.resolve(__dirname, "./cypress/db/test.db");

export default defineConfig({
  projectId: "t5349w",
  e2e: {
    baseUrl: `http://localhost:${process.env.EXPRESS_PORT}`,
    experimentalInteractiveRunEvents: true,
    setupNodeEvents(on, config) {
      on("before:run", async () => {
        console.log(`on('before:run') fired!`);
        await setupTestDatabase();
      });

      on("after:run", () => {
        console.log("on('after:run') fired!");
        cleanupTestDatabase();
      });

      return config;
    },
  },
});

async function setupTestDatabase(): Promise<boolean> {
  return new Promise(async (resolve, reject) => {
    try {
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

      const db = new sqlite3.Database(process.env.ABSOLUTE_DB_PATH!, (err) => {
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

function cleanupTestDatabase() {
  if (nodeFs.existsSync(process.env.ABSOLUTE_DB_PATH!)) {
    nodeFs.unlinkSync(process.env.ABSOLUTE_DB_PATH!);
  }
}
