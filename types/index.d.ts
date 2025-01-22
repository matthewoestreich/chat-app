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
  id: string; // Room ID
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
  id: string; // convo id
  userId: string; // other participant id in DM
  userName: string; // other participant name in DM
  isActive: boolean; // is other participant currently online
}

interface DirectMessage {
  id: string;
  directConversationId: string;
  fromUserId: string;
  toUserId: string;
  message: string;
  timestamp: Date;
}

declare namespace Express {
  export interface Application {
    listenAsync(port: number, hostname: string, backlog: number): Promise<import("node:http").Server<typeof import("node:http").IncomingMessage, typeof import("node:http").ServerResponse>>;
    listenAsync(port: number, hostname: string): Promise<import("node:http").Server<typeof import("node:http").IncomingMessage, typeof import("node:http").ServerResponse>>;
    listenAsync(port: number): Promise<import("node:http").Server<typeof import("node:http").IncomingMessage, typeof import("node:http").ServerResponse>>;
    listenAsync(): Promise<import("node:http").Server<typeof import("node:http").IncomingMessage, typeof import("node:http").ServerResponse>>;
    listenAsync(path: string): Promise<import("node:http").Server<typeof import("node:http").IncomingMessage, typeof import("node:http").ServerResponse>>;
    listenAsync(handle: any, listeningListener?: () => void): Promise<import("node:http").Server<typeof import("node:http").IncomingMessage, typeof import("node:http").ServerResponse>>;
  }
  export interface Request {
    databasePool: DatabasePool<T>;
    cookies: {};
    sessionToken: string;
  }
}
