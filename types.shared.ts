import type { IncomingMessage } from "node:http";

export interface Cookie {
  name: string;
  value: string;
}

export type Cookies = {
  [K: string]: string;
};

export interface JSONWebToken {
  id: string;
  userName: string;
  email: string;
  signed: string;
}

export type ChatScopeType = "Room" | "DirectConversation";

// ChatScope represents a chat room, a direct message, etc..
export interface ChatScope {
  id: string;
  scopeName: string;
  type: ChatScopeType;
  // If in a direct convo
  otherParticipantUserId?: string;
}

export interface DirectConversation {
  id: string;
  userAId: string;
  userBId: string;
}

export type User = {
  userName: string;
  id: string;
  email: string;
  password: string;
};

export type PublicUser = Omit<User, "email" | "password">;

export interface Room {
  id: string;
  name: string;
  isPrivate: 0 | 1;
}

export type Message = {
  id: string;
  userId: string;
  scopeId: string; // roomId/directConvoId,etc..
  message: string;
  timestamp: Date;
  isRead?: boolean;
};

export type PublicMessage = Message & {
  userName: string;
};

export interface Session {
  token: string;
  userId: string;
}

export interface RoomMembership {
  roomId: string;
  userId: string;
}

export interface PublicMember {
  userName: string;
  userId: string;
  scopeId: string;
  isActive: boolean;
}

export type ChatScopeWithMembers = ChatScope & {
  members: PublicMember[];
};

export interface PublicDirectConversation {
  scopeId: string; // convo id
  userId: string; // other participant id in DM
  userName: string; // other participant name in DM
  isActive: boolean; // is other participant currently online
}

export type WebSocketAppError = Error | string;

/** Generally, if an event starts with "GET" it's coming from the client.
 * If an event starts with "LIST", it's typically in response to a "GET" and is sent from the server. */
export interface WebSocketAppEventRegistry {
  CONNECTION_ESTABLISHED: {
    request: IncomingMessage;
    error?: WebSocketAppError;
  };
  CONNECTION_CLOSED: {
    code: number;
    reason: Buffer;
    error?: WebSocketAppError;
  };
  GET_JOINABLE_ROOMS: unknown;
  GET_JOINABLE_DIRECT_CONVERSATIONS: unknown;
  GET_DIRECT_CONVERSATIONS: unknown;
  // Client sends a message.
  SEND_MESSAGE: {
    message: string;
    scope: ChatScope;
  };
  // Client tells server they have entered a room.
  ENTER_ROOM: {
    id: string;
  };
  ENTER_DIRECT_CONVERSATION: {
    scopeId: string;
    // Was this direct convo entered via clicking on a member inside a room?
    isMemberClick: boolean;
  };
  // Client tells server they want to join a room.
  JOIN_ROOM: {
    id: string;
    error?: Error;
  };
  // Client tells server they want to leave (or unjoin) a room.
  UNJOIN_ROOM: {
    id: string;
  };
  LEAVE_DIRECT_CONVERSATION: {
    id: string;
  };
  // Client want to create a new room.
  CREATE_ROOM: {
    name: string;
    isPrivate?: boolean;
  };
  CREATE_DIRECT_CONVERSATION: {
    withUserId: string;
  };
  // We connected.
  CONNECTED: {
    rooms: Room[];
    directConversations: PublicDirectConversation[];
    error?: WebSocketAppError;
  };
  // We logged out.
  CONNECTION_LOGOUT: unknown;
  // Report back to client the message was sent.
  SENT_MESSAGE: {
    message: PublicMessage;
    error?: WebSocketAppError;
  };
  // Server "relays" a message, therefore client receives a message someone else sent (in a room, direct convo, etc..).
  RECEIVE_MESSAGE: {
    message: PublicMessage;
    error?: WebSocketAppError;
  };
  // Server informs client of enter room results.
  ENTERED_ROOM: {
    members: PublicMember[];
    messages: PublicMessage[];
    room: Room;
    error?: WebSocketAppError;
  };
  ENTERED_DIRECT_CONVERSATION: {
    messages: PublicMessage[];
    scopeId: string;
    isMemberClick: boolean;
    error?: WebSocketAppError;
  };
  // Server informs client of join room result, and provides the client with a list of updated rooms.
  JOINED_ROOM: {
    rooms: Room[];
    error?: WebSocketAppError;
  };
  // Create direct convo
  CREATED_DIRECT_CONVERSATION: {
    scopeId: string;
    directConversations: PublicDirectConversation[];
    joinableDirectConversations: PublicMember[];
    error?: WebSocketAppError;
  };
  // Server reports results of unjoin.
  UNJOINED_ROOM: {
    rooms: Room[];
    error?: WebSocketAppError;
  };
  LEFT_DIRECT_CONVERSATION: {
    directConversations: PublicDirectConversation[];
    error?: WebSocketAppError;
  };
  // Server reports create room result + newly created room id + list of updated rooms.
  CREATED_ROOM: {
    id: string;
    rooms: Room[];
    error?: WebSocketAppError;
  };
  // Server sends clients a list of rooms they aren't already a member of (or any conditon, like room is public, etc..)
  LIST_JOINABLE_ROOMS: {
    rooms: Room[];
    error?: WebSocketAppError;
  };
  // Server sends client a list of rooms they are a member of.
  LIST_ROOMS: {
    rooms: Room[];
    error?: WebSocketAppError;
  };
  // Server sends clients all direct convos they're in.
  LIST_DIRECT_CONVERSATIONS: {
    directConversations: PublicDirectConversation[];
    error?: WebSocketAppError;
  };
  // Server sends client a list of users they are not already in a direct convo with (or any condition, like user hasn't blocked them, etc..)
  LIST_JOINABLE_DIRECT_CONVERSATIONS: {
    conversations: PublicMember[];
    error?: WebSocketAppError;
  };
  // When someone enters a room, inform everyone in that room (so we can update "online" status, etc..)
  MEMBER_ENTERED_ROOM: {
    id: string;
    error?: WebSocketAppError;
  };
  // When someone leaves a room, inform everyone in that room (so we can update "online" status, etc..)
  MEMBER_LEFT_ROOM: {
    id: string;
    error?: WebSocketAppError;
  };
  // Someone else disconnected.
  // Going with "USER" instead of "MEMBER" here bc they didn't necessarily have to be a member of anything.
  // This is solely so we can update the "online" status for this user.
  USER_DISCONNECTED: {
    userId: string;
  };
  // Someone else connected.
  USER_CONNECTED: {
    userId: string;
  };
}
