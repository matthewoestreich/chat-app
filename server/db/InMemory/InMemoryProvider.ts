import bcrypt from "bcrypt";
import WebSocketApp from "@/server/wss/WebSocketApp";
import { generateFakeData } from "@/server/fakerService";
import InMemoryDatabase, { InMemoryDatabaseData } from "./InMemoryDatabase";
import InMemoryPool from "./pool/InMemoryPool";
// prettier-ignore
import {
  AccountsRepositoryInMemory,
  DirectConversationsRepositoryInMemory,
  DirectMessagesRepositoryInMemory,
  RoomsMessagesRepositoryInMemory,
  RoomsRepositoryInMemory,
  SessionsRepositoryInMemory
} from "./repositories";

export default class InMemoryProvider implements DatabaseProvider {
  databasePool: DatabasePool<InMemoryDatabase>;
  rooms: RoomsRepository<InMemoryDatabase>;
  roomMessages: RoomsMessagesRepository<InMemoryDatabase>;
  accounts: AccountsRepository<InMemoryDatabase>;
  directConversations: DirectConversationsRepository<InMemoryDatabase>;
  directMessages: DirectMessagesRepository<InMemoryDatabase>;
  sessions: SessionsRepository<InMemoryDatabase>;

  private database: InMemoryDatabase | undefined = undefined;

  constructor(seedOnCreation: boolean) {
    if (seedOnCreation) {
      this.seed();
    }
  }

  private instantiate(): void {
    if (this.database) {
      this.databasePool = new InMemoryPool(this.database);
      this.rooms = new RoomsRepositoryInMemory(this.databasePool);
      this.roomMessages = new RoomsMessagesRepositoryInMemory(this.databasePool);
      this.accounts = new AccountsRepositoryInMemory(this.databasePool);
      this.directConversations = new DirectConversationsRepositoryInMemory(this.databasePool);
      this.directMessages = new DirectMessagesRepositoryInMemory(this.databasePool);
      this.sessions = new SessionsRepositoryInMemory(this.databasePool);
    }
  }

  async initialize(): Promise<void> {
    return Promise.resolve(); // "noop"
  }

  async seed(): Promise<void> {
    return new Promise(async (resolve) => {
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
        messageId: message.id,
        userId: message.user.id,
        roomId: message.room.id,
        message: message.message,
        userName: message.user.username,
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

      const databaseDoesntExist = this.database === undefined;
      this.database = new InMemoryDatabase(inMemoryData);
      if (databaseDoesntExist) {
        this.instantiate();
      }

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
