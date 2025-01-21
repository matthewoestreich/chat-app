// @ts-nocheck
import nodePath from "node:path";
import WebSocketApp from "./server/wss/WebSocketApp";
import { generateFakeData, insertFakeData } from "./scripts/fakeData";
import { defineConfig } from "cypress";
import "dotenv/config";

export default defineConfig({
  e2e: {
    baseUrl: `http://localhost:${process.env.EXPRESS_PORT}`,
    setupNodeEvents(on, config) {
      // implement node event listeners here
      on("before:run", () => {
        // Create test.db with fake data
        if (process.env.IS_GITHUB_ACTION !== "" && process.env.IS_GITHUB_ACTION === "yes") {
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
              const generalRoom: FakeChatRoom = {
                name: "#general",
                id: WebSocketApp.ID_UNASSIGNED,
                isPrivate: 0,
              };
              fakeData.rooms.push(generalRoom);
              fakeData.roomsWithMembers.push({
                room: generalRoom,
                members: fakeData.users,
              });
              await insertFakeData(fakeData, process.env.ABSOLUTE_DB_PATH);
              resolve(true);
            } catch (e) {
              reject(e);
            }
          });
        }
      });

      return config;
    },
  },
});
