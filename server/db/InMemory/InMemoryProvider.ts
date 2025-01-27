import nodeFs from "node:fs";
import appRootPath from "@/appRootPath";
import bcrypt from "bcrypt";
import { generateFakeData } from "@/scripts/fakeData";
import InMemoryDatabase, { InMemoryDatabaseData } from "./InMemoryDatabase";
import InMemoryPool from "./pool/InMemoryPool";
import WebSocketApp from "@/server/wss/WebSocketApp";
import RoomsRepositoryInMemory from "./repositories/RoomsRepository";
import RoomsMessagesRepositoryInMemory from "./repositories/RoomsMessagesRepository";
import AccountsRepositoryInMemory from "./repositories/AccountsRepository";
import DirectConversationsRepositoryInMemory from "./repositories/DirectConversationsRepository";
import DirectMessagesRepositoryInMemory from "./repositories/DirectMessagesRepository";
import SessionsRepositoryInMemory from "./repositories/SessionsRepository";

export default class InMemoryProvider implements DatabaseProvider {
  databasePool: DatabasePool<InMemoryDatabase>;
  rooms: RoomsRepository<InMemoryDatabase>;
  roomMessages: RoomsMessagesRepository<InMemoryDatabase>;
  accounts: AccountsRepository<InMemoryDatabase>;
  directConversations: DirectConversationsRepository<InMemoryDatabase>;
  directMessages: DirectMessagesRepository<InMemoryDatabase>;
  sessions: SessionsRepository<InMemoryDatabase>;

  private database: InMemoryDatabase;

  constructor() {
    this.instantiate();
  }

  // Since we can'thave async in constructor
  private async instantiate(): Promise<void> {
    await this.seed();
    this.databasePool = new InMemoryPool(this.database);
    this.rooms = new RoomsRepositoryInMemory(this.databasePool);
    this.roomMessages = new RoomsMessagesRepositoryInMemory(this.databasePool);
    this.accounts = new AccountsRepositoryInMemory(this.databasePool);
    this.directConversations = new DirectConversationsRepositoryInMemory(this.databasePool);
    this.directMessages = new DirectMessagesRepositoryInMemory(this.databasePool);
    this.sessions = new SessionsRepositoryInMemory(this.databasePool);
  }

  async initialize(): Promise<void> {
    return Promise.resolve(); // "noop"
  }

  async seed(): Promise<void> {
    // TODO remove this, it is just for testing
    const inMemoryJSONFile = appRootPath + "/inMemoryData.json";

    return new Promise(async (resolve) => {
      // TODO remove this, it is just for testing
      if (nodeFs.existsSync(inMemoryJSONFile)) {
        this.database = new InMemoryDatabase(JSON.parse(nodeFs.readFileSync(inMemoryJSONFile, "utf-8")) as InMemoryDatabaseData);
        resolve();
        return;
      }

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

      // Add general room.
      const generalRoom = {
        name: "#general",
        id: WebSocketApp.ID_UNASSIGNED,
        isPrivate: 0,
      };
      fakeData.rooms.push(generalRoom);
      // Add every person to general room.
      fakeData.roomsWithMembers.push({
        room: generalRoom,
        members: fakeData.users,
      });

      const inMemoryData: InMemoryDatabaseData = {} as InMemoryDatabaseData;

      // Add users
      inMemoryData.users = [];
      for (const user of fakeData.users) {
        const salt = await bcrypt.genSalt(10);
        const pw = await bcrypt.hash(user.password, salt);
        inMemoryData.users.push({
          id: user.id,
          name: user.username,
          email: user.email,
          password: pw,
        });
      }

      // Add rooms
      inMemoryData.room = fakeData.rooms.map((room) => ({
        id: room.id,
        name: room.name,
        isPrivate: room.isPrivate === 1 ? 1 : 0,
      }));

      // Add users to rooms
      inMemoryData.chat = [];
      fakeData.roomsWithMembers.forEach((roomAndMembers) => {
        roomAndMembers.members.forEach((member) => {
          inMemoryData.chat.push({ userId: member.id, roomId: roomAndMembers.room.id });
        });
      });

      // Add room messages
      inMemoryData.messages = fakeData.chatRoomMessages.map((message) => ({
        id: message.id,
        userId: message.user.id,
        roomId: message.room.id,
        message: message.message,
        timestamp: new Date(),
      }));

      // Add direct conversations
      inMemoryData.directConversations = fakeData.directConversations.map((dc) => ({
        id: dc.id,
        userA_id: dc.userA.id,
        userB_id: dc.userB.id,
      }));

      // Add direct messages to direct conversations
      inMemoryData.directMessages = fakeData.directMessages.map((dm) => ({
        id: dm.id,
        directConversationId: dm.directConversation.id,
        fromUserId: dm.from.id,
        fromUserName: dm.from.username,
        toUserId: dm.to.id,
        timestamp: new Date(),
        isRead: dm.isRead,
        message: dm.message,
      }));

      // Add sessions (empty)
      inMemoryData.session = [];

      this.database = new InMemoryDatabase(inMemoryData);
      // TODO remove this, it is just for testing
      nodeFs.writeFileSync(inMemoryJSONFile, JSON.stringify(inMemoryData, null, 2));
      resolve();
    });
  }

  backup(): Promise<void> {
    return Promise.resolve();
  }

  restore(): Promise<void> {
    return Promise.resolve();
  }
}
