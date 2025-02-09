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
  userId: string;
  type: ChatScopeType;
  userName: string;
}

export interface DirectConversation {
  id: string;
  userA_id: string;
  userB_id: string;
}

export interface User {
  userName: string;
  id: string;
  email: string;
  password: string;
}

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

export type ChatScopeWithMembers = Omit<ChatScope, "userName"> & {
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

  /** * Client side events. */

  // Since "GET_x" messages are usual a request for data, they usually require no payload, but most def don't require an `error?` field.
  GET_ROOMS: unknown;
  GET_JOINABLE_ROOMS: unknown;
  GET_JOINABLE_DIRECT_CONVERSATIONS: unknown;
  GET_DIRECT_CONVERSATIONS: unknown;
  CONNECTION_LOGOUT: unknown;
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
  JOIN_DIRECT_CONVERSATION: {
    withUserId: string;
  };
  // Client want to create a new room.
  CREATE_ROOM: {
    name: string;
    isPrivate?: boolean;
  };
  CREATE_DIRECT_CONVERSATION: {
    withUserId: string;
  };

  /** * Server side events */

  CONNECTED: {
    rooms: Room[];
    directConversations: PublicDirectConversation[];
    error?: WebSocketAppError;
  };
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
  // Joined direct conversation is used when a user is in a chat room and clicks on a member they wish to have
  // a direct convo with. If they were not already in a direct convo, join will create the convo and then enter it.
  // That is how it differs from CREATE_DIRECT_CONVERSATION (which is used to explicitly create a new convo via the
  // create direct convos modal).
  JOINED_DIRECT_CONVERSATION: {
    directConversations: PublicDirectConversation[];
    withUserId: string;
    directConversationId: string;
    error?: WebSocketAppError;
  };
  // Create direct convo is used to explicitly create a new direct convo via the create convo modal.
  // JOINED_DIRECT_CONVERSATION is used when a user is in a chat room and clicks on a member they wish to have
  // a direct convo with. If they were not already in a direct convo, join will create the convo and then enter it.
  // We send the client back a list of updated direct convos as well as a list of joinable direct convos.
  CREATED_DIRECT_CONVERSATION: {
    directConversations: PublicDirectConversation[];
    joinableDirectConversations: PublicMember[];
    error?: WebSocketAppError;
  };
  // Server reports results of unjoin.
  UNJOINED_ROOM: {
    rooms: Room[];
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
  // Going with "USER" instead of "MEMBER" here bc they didn't necessarily have to be a member of anything.
  // This is solely so we can update the "online" status for this user.
  USER_DISCONNECTED: {
    userId: string;
  };
  USER_CONNECTED: {
    userId: string;
  };
}
