import nodeFs from "node:fs";
import bcrypt from "bcrypt";
import WebSocketApp from "@/server/wss/WebSocketApp";
import { generateFakeData } from "@/server/fakerService";
import FileSystemDatabase, { FileSystemDatabaseData } from "./FileSystemDatabase";
import FileSystemDatabasePool from "./pool/FileSystemDatabasePool";
// prettier-ignore
import { 
  AccountsRepositoryFileSystem,
  DirectConversationsRepositoryFileSystem,
  DirectMessagesRepositoryFileSystem,
  RoomsMessagesRepositoryFileSystem,
  RoomsRepositoryFileSystem,
  SessionsRepositoryFileSystem
} from "./repositories";

export default class FileSystemProvider implements DatabaseProvider {
  databasePool: DatabasePool<FileSystemDatabase>;
  rooms: RoomsRepository<FileSystemDatabase>;
  roomMessages: RoomsMessagesRepository<FileSystemDatabase>;
  accounts: AccountsRepository<FileSystemDatabase>;
  directConversations: DirectConversationsRepository<FileSystemDatabase>;
  directMessages: DirectMessagesRepository<FileSystemDatabase>;
  sessions: SessionsRepository<FileSystemDatabase>;

  private databasePath: string;

  constructor(jsonFilePath: string) {
    this.databasePath = jsonFilePath;
    this.databasePool = new FileSystemDatabasePool(jsonFilePath);
    this.rooms = new RoomsRepositoryFileSystem(this.databasePool);
    this.roomMessages = new RoomsMessagesRepositoryFileSystem(this.databasePool);
    this.accounts = new AccountsRepositoryFileSystem(this.databasePool);
    this.directConversations = new DirectConversationsRepositoryFileSystem(this.databasePool);
    this.directMessages = new DirectMessagesRepositoryFileSystem(this.databasePool);
    this.sessions = new SessionsRepositoryFileSystem(this.databasePool);
  }

  async initialize(): Promise<void> {
    const jsonData = JSON.parse(nodeFs.readFileSync(this.databasePath, "utf-8"));
    if (Object.entries(jsonData).length === 0) {
      await this.seed();
    }
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

      const jsonData: FileSystemDatabaseData = {} as FileSystemDatabaseData;

      // Add users
      jsonData.users = [];
      for (const user of fakeData.users) {
        const salt = await bcrypt.genSalt(10);
        const pw = await bcrypt.hash(user.password, salt);
        jsonData.users.push({
          id: user.id,
          name: user.username,
          email: user.email,
          password: pw,
        });
      }

      // Add rooms
      jsonData.room = fakeData.rooms.map((room) => ({
        id: room.id,
        name: room.name,
        isPrivate: room.isPrivate === 1 ? 1 : 0,
      }));

      // Add users to rooms
      jsonData.chat = [];
      fakeData.roomsWithMembers.forEach((roomAndMembers) => {
        roomAndMembers.members.forEach((member) => {
          jsonData.chat.push({ userId: member.id, roomId: roomAndMembers.room.id });
        });
      });

      // Add room messages
      jsonData.messages = fakeData.chatRoomMessages.map((message) => ({
        messageId: message.id,
        userId: message.user.id,
        roomId: message.room.id,
        message: message.message,
        userName: message.user.username,
        timestamp: new Date(),
      }));

      // Add direct conversations
      jsonData.directConversations = fakeData.directConversations.map((dc) => ({
        id: dc.id,
        userA_id: dc.userA.id,
        userB_id: dc.userB.id,
      }));

      // Add direct messages to direct conversations
      jsonData.directMessages = fakeData.directMessages.map((dm) => ({
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
      jsonData.session = [];

      nodeFs.writeFileSync(this.databasePath, JSON.stringify(jsonData, null, 2));
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
