import { DirectConversation, DirectMessage, Message, PublicDirectConversation, PublicUser, Room, RoomWithMembers, Session, User, WebSocketAppEventRegistry } from "@/types.shared";
import type { WebSocket } from "ws";

declare class WebSocketClient {
  get socket(): WebSocket;
  get user(): User;
  get activeIn(): CachedContainer;
  set user(account: User);
  setActiveIn(id: string, container: Container): void;
  send<K extends EventTypes>(type: K, payload: EventPayload<K>): void;
  broadcast<K extends EventTypes>(type: K, payload: EventPayload<K>): void;
}

export type IWebSocketMessage = {
  type: EventTypes;
  [key: string]: unknown;
};

export type WebSocketAppCatchHandler = (error: Error, socket: WebSocket) => void;

export type WebSocketAppCache = Map<string, Container>;

export type Container = Map<string, WebSocketClient>;

/** CachedContainer is different from Container bc a CachedContainer has an ID. */
export type CachedContainer = {
  id: string;
  container?: Container;
};

export type EventTypes = keyof WebSocketAppEventRegistry;
export type EventPayload<K extends EventTypes> = WebSocketAppEventRegistry[K];

export interface DatabasePoolConnection<T> {
  db: T;
  id: string;
  release(): void;
}

export interface DatabasePool<T> {
  getConnection(): Promise<DatabasePoolConnection<T>>;
  releaseConnection(connection: DatabasePoolConnection<T>): void;
}

export interface RoomsRepository<DB> {
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
  selectRoomMembersExcludingUser(roomId: string, excludingUserId: string): Promise<PublicUser[]>;
  selectRoomMembersByRoomId(roomId: string): Promise<PublicUser[]>;
}

export interface AccountsRepository<DB> {
  databasePool: DatabasePool<DB>;
  getAll(): Promise<User[]>;
  getById(id: string): Promise<User>;
  create(name: string, passwd: string, email: string): Promise<User>;
  update(id: string, entity: User): Promise<User | null>;
  delete(id: string): Promise<boolean>;
  selectByEmail(email: string): Promise<User>;
}

export interface DirectConversationsRepository<DB> {
  databasePool: DatabasePool<DB>;
  getAll(): Promise<DirectConversation[]>;
  getById(id: string): Promise<DirectConversation>;
  create(userA_id: string, userB_id: string): Promise<DirectConversation>;
  update(id: string, entity: DirectConversation): Promise<DirectConversation | null>;
  delete(id: string): Promise<boolean>;
  selectByUserId(userId: string): Promise<PublicDirectConversation[]>;
  selectInvitableUsersByUserId(userId: string): Promise<PublicUser[]>;
}

export interface DirectMessagesRepository<DB> {
  databasePool: DatabasePool<DB>;
  getAll(): Promise<DirectMessage[]>;
  getById(id: string): Promise<DirectMessage>;
  create(directConversationId: string, fromUserId: string, toUserId: string, message: string): Promise<DirectMessage>;
  update(id: string, entity: DirectMessage): Promise<DirectMessage | null>;
  delete(id: string): Promise<boolean>;
  selectByDirectConversationId(directConversationId: string): Promise<DirectMessage[]>;
}

export interface RoomsMessagesRepository<T> {
  databasePool: DatabasePool<T>;
  getAll(): Promise<Message[]>;
  getById(id: string): Promise<Message>;
  create(roomId: string, userId: string, userName: string, message: string): Promise<Message>;
  update(id: string, entity: Message): Promise<Message | null>;
  delete(id: string): Promise<boolean>;
  selectByRoomId(roomId: string): Promise<Message[]>;
}

export interface SessionsRepository<T> {
  databasePool: DatabasePool<T>;
  getAll(): Promise<Session[]>;
  getById(id: string): Promise<Session>;
  create(userId: string, sessionToken: string): Promise<Session>;
  update(id: string, entity: Session): Promise<Session | null>;
  delete(id: string): Promise<boolean>;
  selectByUserId(userId: string): Promise<Session | undefined>;
  deleteByUserId(userId: string): Promise<boolean>;
  upsert(userId: string, token: string): Promise<boolean>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface DatabaseProvider<T = any> {
  databasePool: DatabasePool<T>;
  rooms: RoomsRepository<T>;
  roomMessages: RoomsMessagesRepository<T>;
  accounts: AccountsRepository<T>;
  directConversations: DirectConversationsRepository<T>;
  directMessages: DirectMessagesRepository<T>;
  sessions: SessionsRepository<T>;
  initialize(): Promise<void>;
  seed(): Promise<void>;
  backup(): Promise<void>;
  restore(): Promise<void>;
}

export interface GenerateFakeUsersParams {
  numberOfUsers: number;
  makeIdentical: boolean;
}

export interface GenerateFakeChatRoomsParams {
  numberOfRooms: number;
  longNameFrequency: FakeDataFrequency;
}

export interface AddFakeUsersToFakeChatRoomsParams {
  minUsersPerRoom: number;
  maxUsersPerRoom: number;
}

export interface GenerateFakeChatRoomMessagesParams {
  maxMessagesPerRoom: number;
  minMessageLength: number;
  maxMessageLength: number;
}

export interface GenerateFakeDirectConversationsParams {
  minConversationsPerUser: number;
  maxConversationsPerUser: number;
}

export interface GenerateFakeDirectMessagesParams {
  minMessagesPerConversation: number;
  maxMessagesPerConversation: number;
  minMessageLength: number;
  maxMessageLength: number;
}

export interface GenerateFakeDataParams {
  userParams: GenerateFakeUsersParams;
  chatRoomsParams: GenerateFakeChatRoomsParams;
  chatRoomsWithMembersParams: AddFakeUsersToFakeChatRoomsParams;
  chatRoomMessagesParams: GenerateFakeChatRoomMessagesParams;
  directConversationParams: GenerateFakeDirectConversationsParams;
  directMessagesParams: GenerateFakeDirectMessagesParams;
}

export interface FakeData {
  users: FakeUser[];
  rooms: FakeChatRoom[];
  roomsWithMembers: FakeChatRoomWithMembers[];
  chatRoomMessages: FakeChatRoomMessage[];
  directConversations: FakeDirectConversation[];
  directMessages: FakeDirectMessage[];
}

export interface FakeUser {
  username: string;
  password: string;
  email: string;
  id: string;
}

export interface FakeChatRoom {
  name: string;
  id: string;
  isPrivate: number;
}

export interface FakeChatRoomMessage {
  id: string;
  user: FakeUser;
  room: FakeChatRoom;
  message: string;
}

export interface FakeChatRoomWithMembers {
  room: FakeChatRoom;
  members: FakeUser[];
}

export interface FakeDirectMessage {
  id: string;
  directConversation: FakeDirectConversation;
  from: FakeUser;
  to: FakeUser;
  message: string;
  timestamp: Date;
  isRead: boolean;
}

export interface FakeDirectConversation {
  id: string;
  userA: FakeUser;
  userB: FakeUser;
}

export type FakeDataFrequency = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

// Shape of object returned from GitHub API for getting a Gist.
export interface Gist {
  url: string;
  forks_url: string;
  commits_url: string;
  id: string;
  node_id: string;
  git_pull_url: string;
  git_push_url: string;
  html_url: string;
  files: GistFile[];
  public: boolean;
  created_at: Date;
  updated_at: Date;
  description: string;
  comments: number;
  user: string | null;
  comments_url: string;
  owner: GistOwner;
  // eslint-disable-next-line
  forks: any[]; // IDK WHAT THIS RETURNS
  history: GistHistory[];
}

// Shape of object returned from GitHub API for a file that is part of a Gist.
export interface GistFile {
  filename: string;
  type: string;
  language: string;
  raw_url: string;
  size: number;
  truncated: boolean;
  content: string;
}

export interface GistOwner {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  user_view_type: string;
  site_admin: boolean;
}

export interface GistHistory {
  user: GistOwner;
  version: string;
  committed_at: Date;
  change_status: GistChangeStatus;
  url: string;
}

export interface GistChangeStatus {
  total: number;
  additions: number;
  deletions: number;
}

export interface FilesObject {
  [fileName: string]: { content: string };
}
