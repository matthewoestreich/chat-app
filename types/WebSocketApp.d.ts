declare class WebSocketClient {
  get socket(): WebSocket.WebSocket;
  get user(): Account;
  get activeIn(): CachedContainer;
  set user(account: Account);
  setActiveIn(id: string, container: Container);
  send<K extends EventTypes>(type: K, payload: EventPayload<K>);
  broadcast<K extends EventTypes>(type: K, payload: EventPayload<K>);
}

type IWebSocketMessage = {
  type: EventTypes;
  [key: string]: unknown;
};

type WebSocketAppCatchHandler = (error: Error, socket: WebSocket.WebSocket) => void;

type WebSocketAppCache = Map<string, Container>;

type Container = Map<string, WebSocketClient>;

/**
 * CachedContainer is different from Container bc a CachedContainer has an ID.
 */
type CachedContainer = {
  id: string;
  container?: Container;
};

type ChatScopeType = "Room" | "DirectConversation";

// ChatScope represents a chat room, a direct message, etc..
interface ChatScope {
  id: string;
  type: ChatScopeType;
  name: string;
}

type EventTypes = keyof WebSocketAppEventRegistry;
type EventPayload<K extends EventTypes> = WebSocketAppEventRegistry[K];

/**
 * Generally, if an event starts with "GET" it's coming from the client.
 * If an event starts with "LIST", it's typically in response to a "GET" and is sent from the server.
 */
interface WebSocketAppEventRegistry {
  CONNECTION_ESTABLISHED: {
    request: IncomingMessage;
    error?: Error;
  };
  CONNECTION_CLOSED: {
    code: number;
    reason: Buffer;
    error?: Error;
  };

  /**
   * Client side events.
   */

  // Since "GET_x" messages are usual a request for data, they usually require no payload, but most def don't require an `error?` field.
  GET_ROOMS: unknown;
  GET_JOINABLE_ROOMS: unknown;
  GET_INVITABLE_USERS: unknown;
  GET_DIRECT_CONVERSATIONS: unknown;
  GET_DIRECT_MESSAGES: {
    id: string;
  };
  // Client sends a message.
  SEND_MESSAGE: {
    scope: ChatScopeType;
    message: string;
  };
  // Client tells server they have entered a room.
  ENTER_ROOM: {
    id: string;
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
  // Client want to create a new room.
  CREATE_ROOM: {
    name: string;
    isPrivate?: boolean;
  };

  /**
   * Server side events
   */

  // Report back to client the message was sent.
  SENT_MESSAGE: {
    message: PublicMessage;
    error?: Error;
  };
  // Server "relays" a message, therefore client receives a message someone else sent (in a room, direct convo, etc..).
  RECEIVE_MESSAGE: {
    userId: string;
    userName: string;
    message: string;
    error?: Error;
  };
  // Server informs client of enter room results.
  ENTERED_ROOM: {
    members: RoomMember[];
    messages: PublicMessage[];
    room: IRoom;
    error?: Error;
  };
  // Server informs client of join room result, and provides the client with a list of updated rooms.
  JOINED_ROOM: {
    rooms: IRoom[];
    error?: Error;
  };
  // Server reports results of unjoin.
  UNJOINED_ROOM: {
    rooms: IRoom[];
    error?: Error;
  };
  // Server reports create room result + newly created room id + list of updated rooms.
  CREATED_ROOM: {
    id: string;
    rooms: IRoom[];
    error?: Error;
  };
  // Server sends clients a list of rooms they aren't already a member of (or any conditon, like room is public, etc..)
  LIST_JOINABLE_ROOMS: {
    rooms: IRoom[];
    error?: Error;
  };
  // Server sends client a list of rooms they are a member of.
  LIST_ROOMS: {
    rooms: IRoom[];
    error?: Error;
  };
  // Server sends clients all direct convos they're in.
  LIST_DIRECT_CONVERSATIONS: {
    directConversations: DirectConversationByUserId[];
    error?: Error;
  };
  // Server sends client a list of messages for a particular direct convo.
  LIST_DIRECT_MESSAGES: {
    directMessages: DirectMessage[];
    error?: Error;
  };
  // Server sends client a list of users they are not already in a direct convo with (or any condition, like user hasn't blocked them, etc..)
  LIST_INVITABLE_USERS: {
    users: PublicAccount[];
    error?: Error;
  };
  // Server sends client the results of a create room request.
  ROOM_CREATED: {
    id: string;
    error?: Error;
  };
  // When someone enters a room, inform everyone in that room (so we can update "online" status, etc..)
  MEMBER_ENTERED_ROOM: {
    id: string;
    error?: Error;
  };
  // When someone leaves a room, inform everyone in that room (so we can update "online" status, etc..)
  MEMBER_LEFT_ROOM: {
    id: string;
    error?: Error;
  };
}
