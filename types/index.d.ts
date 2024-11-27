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
  id: string;
  toUserId: string;
  fromUserId: string;
}

declare namespace Express {
  export interface Request {
    databasePool: DatabasePool<T>;
    cookies: {};
    sessionToken: string;
  }
}
