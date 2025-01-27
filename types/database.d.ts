interface DatabasePoolConnection<T> {
  db: T;
  id: string;
  release(): void;
}

interface DatabasePool<T> {
  getConnection(): Promise<DatabasePoolConnection<T>>;
  releaseConnection(connection: DatabasePoolConnection<T>): void;
}

interface RoomsRepository<DB> {
  databasePool: DatabasePool<DB>;
  getAll(): Promise<Room[]>;
  getById(id: string): Promise<Room>;
  create(name: string, isPrivate?: 0 | 1): Promise<Room>;
  update(id: string, entity: Room): Promise<Room | null>;
  delete(id: string): Promise<boolean>;
  selectUnjoinedRooms(userId: string): Promise<Room[]>;
  addUserToRoom(userId: string, roomId: string): Promise<boolean>;
  selectByUserId(userId: string): Promise<Room[]>;
  removeUserFromRoom(userId: string, roomId: string): Promise<boolean>;
  selectRoomsWithMembersByUserId(userId: string): Promise<RoomWithMembers[]>;
  selectRoomMembersExcludingUser(roomId: string, excludingUserId: string): Promise<RoomMember[]>;
  selectRoomMembersByRoomId(roomId: string): Promise<RoomMember[]>;
}

interface AccountsRepository<DB> {
  databasePool: DatabasePool<DB>;
  getAll(): Promise<Account[]>;
  getById(id: string): Promise<Account>;
  create(name: string, passwd: string, email: string): Promise<Account>;
  update(id: string, entity: Account): Promise<Account | null>;
  delete(id: string): Promise<boolean>;
  selectByEmail(email: string): Promise<Account>;
}

interface DirectConversationsRepository<DB> {
  databasePool: DatabasePool<DB>;
  getAll(): Promise<DirectConversation[]>;
  getById(id: string): Promise<DirectConversation>;
  create(userA_id: string, userB_id: string): Promise<DirectConversation>;
  update(id: string, entity: DirectConversation): Promise<DirectConversation | null>;
  delete(id: string): Promise<boolean>;
  selectByUserId(userId: string): Promise<DirectConversationByUserId[]>;
  selectInvitableUsersByUserId(userId: string): Promise<PublicAccount[]>;
}

interface DirectMessagesRepository<DB> {
  databasePool: DatabasePool<DB>;
  getAll(): Promise<DirectMessage[]>;
  getById(id: string): Promise<DirectMessage>;
  create(entity: DirectMessage): Promise<DirectMessage>;
  update(id: string, entity: DirectMessage): Promise<DirectMessage | null>;
  delete(id: string): Promise<boolean>;
  selectByDirectConversationId(directConversationId: string): Promise<DirectMessage[]>;
}

interface RoomsMessagesRepository<DB> {
  databasePool: DatabasePool<DB>;
  getAll(): Promise<Message[]>;
  getById(id: string): Promise<Message>;
  create(roomId: string, userId: string, message: string): Promise<Message>;
  update(id: string, entity: Message): Promise<Message | null>;
  delete(id: string): Promise<boolean>;
  selectByRoomId(roomId: string): Promise<Message[]>;
}

interface SessionsRepository<DB> extends Repository<Session> {
  databasePool: DatabasePool<DB>;
  getAll(): Promise<Session[]>;
  getById(id: string): Promise<Session>;
  create(userId: string, sessionToken: string): Promise<Session>;
  update(id: string, entity: Session): Promise<Session | null>;
  delete(id: string): Promise<boolean>;
  selectByUserId(userId: string): Promise<Session | undefined>;
  deleteByUserId(userId: string): Promise<boolean>;
  upsert(userId: string, token: string): Promise<boolean>;
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
