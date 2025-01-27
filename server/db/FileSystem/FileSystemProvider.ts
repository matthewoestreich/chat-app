import FileSystemDatabase from "./FileSystemDatabase";
import FileSystemDatabasePool from "./pool/FileSystemDatabasePool";
import { AccountsRepositoryFileSystem, DirectConversationsRepositoryFileSystem, DirectMessagesRepositoryFileSystem, RoomsMessagesRepositoryFileSystem, RoomsRepositoryFileSystem, SessionsRepositoryFileSystem } from "./repositories";

export default class FileSystemProvider implements DatabaseProvider {
  databasePool: DatabasePool<FileSystemDatabase>;
  rooms: RoomsRepository<FileSystemDatabase>;
  roomMessages: RoomsMessagesRepository<FileSystemDatabase>;
  accounts: AccountsRepository<FileSystemDatabase>;
  directConversations: DirectConversationsRepository<FileSystemDatabase>;
  directMessages: DirectMessagesRepository<FileSystemDatabase>;
  sessions: SessionsRepository<FileSystemDatabase>;

  constructor(jsonFilePath: string) {
    this.databasePool = new FileSystemDatabasePool(jsonFilePath);
    this.rooms = new RoomsRepositoryFileSystem(this.databasePool);
    this.roomMessages = new RoomsMessagesRepositoryFileSystem(this.databasePool);
    this.accounts = new AccountsRepositoryFileSystem(this.databasePool);
    this.directConversations = new DirectConversationsRepositoryFileSystem(this.databasePool);
    this.directMessages = new DirectMessagesRepositoryFileSystem(this.databasePool);
    this.sessions = new SessionsRepositoryFileSystem(this.databasePool);
  }

  initialize(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  seed(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  backup(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  restore(): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
