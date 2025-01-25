interface DatabasePoolConnection<T> {
  db: T;
  id: string;
  release(): void;
}

interface DatabasePool<T> {
  getConnection(): Promise<DatabasePoolConnection<T>>;
  releaseConnection(connection: DatabasePoolConnection<T>): void;
}

interface Repository<T> {
  databasePool: DatabasePool<DB>;
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T>;
  create(entity: T): Promise<T>;
  update(id: string, entity: T): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}

interface RoomsRepository<DB> extends Repository<Room> {
  selectUnjoinedRooms(userId: string): Promise<Room[]>;
  addUserToRoom(userId: string, roomId: string): Promise<boolean>;
  selectByUserId(userId: string): Promise<Room[]>;
  removeUserFromRoom(userId: string, roomId: string): Promise<boolean>;
  selectRoomsWithMembersByUserId(userId: string): Promise<RoomWithMembers[]>;
  selectRoomMembersExcludingUser(roomId: string, excludingUserId: string): Promise<RoomMember[]>;
  selectRoomMembersByRoomId(roomId: string): Promise<RoomMember[]>;
}

interface AccountsRepository<DB> extends Repository<Account> {
  selectByEmail(email: string): Promise<Account>;
}

interface DirectConversationsRepository<DB> extends Repository<DirectConversation> {
  selectByUserId(userId: string): Promise<DirectConversation[]>;
  selectInvitableUsersByUserId(userId: string): Promise<Account[]>;
}

interface DirectMessagesRepository<DB> extends Repository<DirectMessage> {
  selectByDirectConversationId(directConversationId: string): Promise<DirectMessage[]>;
}

interface RoomsMessagesRepository<DB> extends Repository<Message> {
  selectByRoomId(roomId: string): Promise<Message[]>;
}

interface SessionsRepository<DB> extends Repository<Session> {
  selectByUserId(userId: string): Promise<Session>;
  deleteByUserId(userId: string): Promise<boolean>;
  upsert(entity: Session): Promise<boolean>;
}

interface DatabaseProvider {
  databasePool: DatabasePool<DB>;
  rooms: RoomsRepository<DB>;
  roomMessages: RoomsMessagesRepository<DB>;
  accounts: AccountsRepository<DB>;
  directConversations: DirectConversationsRepository<DB>;
  directMessages: DirectMessagesRepository<DB>;
  sessions: SessionsRepository<DB>;
  initialize(): Promise<void>;
  seed(): Promise<void>;
  backup(): Promise<void>;
  restore(): Promise<void>;
}
