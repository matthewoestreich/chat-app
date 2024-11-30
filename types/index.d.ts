interface DatabasePoolConnection<T> {
  db: T;
  release(): void;
}

interface DatabasePool<T> {
  getConnection(): Promise<DatabasePoolConnection<T>>;
  releaseConnection(connection: DatabasePoolConnection<T>): void;
  //query(sql: string, params: any): Promise<unknown>;
  //closeAllIdleConnections(): Promise<boolean>;
}

interface RoomMember {
  userName: string;
  userId: string;
  roomId: string;
  isActive: boolean;
}

interface Room {
  id: string;
  name: string;
  isPrivate: 0 | 1;
}

interface Message {
  id: string;
  userId: string;
  userName: string;
  roomId: string;
  message: string;
  timestamp: Date;
}

interface SessionToken {
  id: string;
  name: string;
  email: string;
}

interface Session {
  token: SessionToken;
  userId: string;
}

interface Account {
  name: string;
  id: string;
  email: string;
  password?: string;
}

interface RoomWithMembers {
  id: string;
  name: string;
  members: Account[];
}

interface Room {
  id: string;
  name: string;
}

interface Cookies {
  [key: string]: string;
}

interface DirectConversation {
  directConversationId: string; // convo id
  id: string; // other participant id in DM
  name: string; // other participant name in DM
  isActive: boolean; // is other participant currently online
}

interface IWebSocketMessageData {
  [key: string]: any;
}

type IWebSocketMessage = {
  type: EventType;
  error?: Error | string | undefined;
  [key: string]: any;
};

// When a user first connects to a WebSocket they aren't in any room, but they should still be considered online.
// Users that are online, but not in a room, should still show online to those that try to DM them.
const ROOM_ID_UNASSIGNED: string = "__UNASSIGNED__";

declare namespace Express {
  export interface Request {
    databasePool: DatabasePool<T>;
    cookies: {};
    sessionToken: string;
  }
}
