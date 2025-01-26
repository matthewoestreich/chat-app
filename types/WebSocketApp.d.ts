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

type EventTypes = keyof WebSocketAppEventRegistry;
type EventPayload<K extends EventTypes> = WebSocketAppEventRegistry[K];

interface WebSocketAppEventRegistry {
  CONNECTION_ESTABLISHED: {
    request: IncomingMessage;
  };
  CONNECTION_CLOSED: {
    code: number;
    reason: Buffer;
  };
  // The message we relay (send back to client(s)) when someone sends a message.
  RECEIVE_MESSAGE: {
    userId: string;
    userName: string;
    message: string;
  };
  // The message a client sends us when they want to send a message to a room.
  // The room id is not needed bc we use the `client.activeIn` as the room id.
  // If we allow people to pass in the room id, we have to make sure they aren't spoofing
  // to a different room.
  SEND_MESSAGE: {
    message: string;
  };
  // The message a client sends us when they enter a room.
  ENTER_ROOM: {
    id: string;
  };
  // The message we send back to the client after successfully entering a room.
  // We send them the members of that room, as well as the messages stored for that room.
  ENTERED_ROOM: {
    members: RoomMember[];
    messages: Message[];
  };
  // The message a client sends us when they want to join a room.
  JOIN_ROOM: {
    id: string;
  };
  // The message sent back to the client after joining a room.
  // We send them an updated list of rooms.
  JOINED_ROOM: {
    rooms: Room[];
  };
  // The message a client sends us when they want to unjoin a room.
  // `id` is the id of the room they want to unjoin.
  UNJOIN_ROOM: {
    id: string;
  };
  // The message sent back to the client after unjoining a room.
  // We send them an updated list of rooms.
  UNJOINED_ROOM: {
    rooms: Room[];
  };
  // The message a client sends us when they want to create a new room.
  CREATE_ROOM: {
    name: string;
    isPrivate?: boolean;
  };
  // The message sent back to the client after a room was created.
  // We send them the id of the newly created room plus a list of updated rooms.
  CREATED_ROOM: {
    id: string;
    rooms: Room[];
  };
  SEND_MESSAGE: {
    containerId: string;
    message: string;
  };
  LEAVE_ROOM: unknown; //{};
  LIST_JOINABLE_ROOMS: {
    rooms: Room[];
  };
  GET_JOINABLE_ROOMS: unknown; //{};
  LIST_ROOMS: {
    rooms: Room | Room[];
  };
  LIST_ROOM_MEMBERS: unknown; //{};
  LIST_DIRECT_CONVERSATIONS: {
    directConversations: DirectConversationByUserId[];
  };
  GET_DIRECT_CONVERSATIONS: unknown; //{};
  GET_DIRECT_MESSAGES: {
    id: string;
  };
  LIST_DIRECT_MESSAGES: {
    directMessages: DirectMessage[];
  };
  GET_INVITABLE_USERS: unknown; //{};
  LIST_INVITABLE_USERS: {
    users: Account[];
  };
  ROOM_CREATED: {
    id: string;
  };
  MEMBER_ENTERED_ROOM: {
    id: string;
  };
  MEMBER_LEFT_ROOM: {
    id: string;
  };
  ERROR: {
    event: EventTypes;
    error: Error;
  };
}
