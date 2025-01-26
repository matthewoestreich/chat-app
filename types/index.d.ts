interface RoomMember {
  name: string;
  id: string;
  roomId: string; // Room ID
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
  userName?: string;
  roomId: string;
  message: string;
  timestamp: Date;
}

interface JSONWebToken {
  id: string;
  name: string;
  email: string;
  signed: string;
}

interface Session {
  token: string;
  userId: string;
}

interface Account {
  name: string;
  id: string;
  email: string;
  password: string;
}

interface RoomWithMembers {
  id: string;
  name: string;
  members: RoomMember[];
}

interface Room {
  id: string;
  name: string;
}

interface Cookies {
  [key: string]: string;
}

// This is the schema of the database
interface DirectConversation {
  id: string;
  userA_id: string;
  userB_id: string;
}

interface DirectConversationByUserId {
  id: string; // convo id
  userId: string; // other participant id in DM
  userName: string; // other participant name in DM
  isActive?: boolean; // is other participant currently online
}

interface DirectMessage {
  id: string;
  directConversationId: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  message: string;
  isRead: boolean;
  timestamp: Date;
}

declare namespace Express {
  export interface Application {
    listenAsync(port: number, hostname: string, backlog: number): Promise<import("node:http").Server<typeof import("node:http").IncomingMessage, typeof import("node:http").ServerResponse>>;
    listenAsync(port: number, hostname: string): Promise<import("node:http").Server<typeof import("node:http").IncomingMessage, typeof import("node:http").ServerResponse>>;
    listenAsync(port: number): Promise<import("node:http").Server<typeof import("node:http").IncomingMessage, typeof import("node:http").ServerResponse>>;
    listenAsync(): Promise<import("node:http").Server<typeof import("node:http").IncomingMessage, typeof import("node:http").ServerResponse>>;
    listenAsync(path: string): Promise<import("node:http").Server<typeof import("node:http").IncomingMessage, typeof import("node:http").ServerResponse>>;
    // eslint-disable-next-line
    listenAsync(handle: any, listeningListener?: () => void): Promise<import("node:http").Server<typeof import("node:http").IncomingMessage, typeof import("node:http").ServerResponse>>;
  }
  export interface Request {
    databaseProvider: DatabaseProvider;
    cookies: unknown;
    sessionToken: string;
  }
}
