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

interface Repositories {
  rooms: RoomsRepository<DB>;
  roomMessages: RoomsMessagesRepository<DB>;
  accounts: AccountsRepository<DB>;
  directConversations: DirectConversationsRepository<DB>;
  directMessages: DirectMessagesRepository<DB>;
  sessions: SessionsRepository<DB>;
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

interface IRoomsService<DB> {
  selectAll(): Promise<Room[]>;
  selectById(id: string): Promise<Room>;
  selectByUserId(userId: string): Promise<Room[]>;
  selectUnjoinedRooms(userId: string): Promise<Room[]>;
  insert(roomName: string, isPrivate?: 0 | 1): Promise<Room>;
  selectRoomsWithMembersByUserId(userId: string): Promise<RoomWithMembers[]>;
  selectRoomMembersByRoomId(roomId: string): Promise<RoomMember[]>;
  selectRoomMembersExcludingUserById(roomId: string, excludingUserId: string): Promise<RoomMember[]>;
  removeUserFromRoom(userId: string, roomId: string): Promise<boolean>;
  addUserToRoom(userId: string, roomId: string): Promise<boolean>;
}

interface ISessionsService<DB> {
  insert(userId: string, token: string): Promise<Session>;
  upsert(userId: string, token: string): Promise<boolean>;
  delete(token: string): Promise<boolean>;
  deleteByUserId(userId: string): Promise<boolean>;
  selectByUserId(userId: string): Promise<Session>;
}

interface IRoomsMessagesService<DB> {
  insert(roomId: string, userId: string, message: string, userName?: string): Promise<Message>;
  selectByRoomId(roomId: string): Promise<Message[]>;
}

interface IDirectMessagesService<DB> {
  selectByDirectConversationId(directConversationId: string): Promise<DirectMessage[]>;
}

interface IDirectConversationsService<DB> {
  selectByUserId(userId: string): Promise<DirectConversation[]>;
  selectInvitableUsersByUserId(userId: string): Promise<Account[]>;
  insert(userA_id: string, userB_id: string): Promise<DirectConversation>;
}

interface IAccountsService<DB> {
  insert(entity: Account): Promise<Account>;
  selectByEmail(email: string): Promise<Account>;
  selectById(id: string): Promise<Account>;
}

interface DatabaseProvider {
  rooms: IRoomsService<DB>;
  roomMessages: IRoomsMessagesService<DB>;
  accounts: IAccountsService<DB>;
  directConversations: IDirectConversationsService<DB>;
  directMessages: IDirectMessagesService<DB>;
  sessions: ISessionsService<DB>;
  initialize(): Promise<void>;
  seed(): Promise<void>;
  backup(): Promise<void>;
  restore(): Promise<void>;
}
