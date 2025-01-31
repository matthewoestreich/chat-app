/**
 *
 * BE MINDFUL! THESE TYPES ARE SHARED WITH FRONTEND!
 *
 *
 * Broad/general types
 *
 */
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

type PublicAccount = Omit<Account, "password" | "email">;

interface AuthenticatedUser {
  name: string;
  email: string;
  id: string;
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

interface Cookie {
  name: string;
  value: string;
}

type Cookies = {
  [K: string]: string;
};

interface UseCookie {
  setCookie(name: string, value: string, days: number, path?: string): void;
  getAllCookies(): Cookies;
  getCookie(name: string): Cookie | undefined;
  clearAllCookies(): void;
  clearCookie(name: string, path: string): boolean;
}
