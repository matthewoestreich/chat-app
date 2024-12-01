/**
 * A handler for an emitted event.
 * @typedef {(socket: WebSocket, data: { [key: string]: any }) => void} EventHandler
 */

// Add "emit" to WebSocket proto
WebSocket.prototype.emitToServer = function (eventType, payload) {
  this.send(JSON.stringify({ type: eventType, payload }));
};

const EventType = {
  SEND_MESSAGE: "SEND_MESSAGE",
  CREATE_ROOM: "CREATE_ROOM",
  JOIN_ROOM: "JOIN_ROOM",
  UNJOIN_ROOM: "UNJOIN_ROOM",
  ENTER_ROOM: "ENTER_ROOM",
  LEAVE_ROOM: "LEAVE_ROOM",
  LIST_JOINABLE_ROOMS: "LIST_JOINABLE_ROOMS",
  LIST_ROOMS: "LIST_ROOMS",
  LIST_ROOM_MEMBERS: "LIST_ROOM_MEMBERS",
  LIST_DIRECT_CONVERSATIONS: "LIST_DIRECT_CONVERSATIONS",
  MEMBER_ENTERED_ROOM: "MEMBER_ENTERED_ROOM",
  MEMBER_LEFT_ROOM: "MEMBER_LEFT_ROOM",
  CONNECTION_ESTABLISHED: "CONNECTION_ESTABLISHED",
  CONNECTION_CLOSED: "CONNECTION_CLOSED",
};

class WebSocketMessage {
  /** @type {EventType} */
  type = undefined;
  /** @type {Error} */
  error = undefined;

  /**
   * Parses RawData from WebSocket into WebSocketMessage.
   * @param {ArrayBuffer | Buffer[] | string} data
   * @returns {WebSocketMessage}
   */
  static from(data) {
    const { type, ...rest } = JSON.parse(String(data));
    return new WebSocketMessage(type, rest);
  }

  constructor(type, dataOrError) {
    this.type = type;
    if (dataOrError instanceof Error || typeof dataOrError === "string") {
      this.error = dataOrError;
      return;
    }
    if (typeof dataOrError === "object" && dataOrError !== null) {
      Object.assign(this, dataOrError);
      return;
    }
  }
}

class WebSocketApp {
  /** @type {WebSocket} */
  #socket;
  /** @type {{ [key: string]: EventHandler }} */
  #listeners;

  /**
   * Error handler
   * @param {Error} error
   * @param {WebSocket} socket
   */
  #catchFn = (error, socket) => {};

  #parseRawMessage = (rawMessage) => {
    if (!rawMessage?.data) {
      return new Error(`[ws][parseRawMessage] No data found on message.`);
    }
    const message = WebSocketMessage.from(rawMessage.data);
    if (!message?.type) {
      new Error(`[ws][parseRawMessage] No type found in message.`);
    }
    if (!(message.type in EventType)) {
      return new Error(`[ws][parseRawMessage] Message type not recognized. Got : '${message.type}'`);
    }
    return message;
  };

  /**
   * URL for web socket server
   * @param {string} webSocketUrl
   */
  constructor(webSocketUrl) {
    if (!webSocketUrl) {
      throw new Error(`WebSocketApp : webSocketUrl is required!`);
    }

    this.#socket = new WebSocket(webSocketUrl);
    this.#listeners = {};

    this.#socket.onopen = () => {
      console.log(`ws connected`);
    };

    this.#socket.onclose = (ws, event) => {
      console.log({ socket: "closed", ws, event });
    };

    this.#socket.onmessage = (rawMessage) => {
      const messageOrError = this.#parseRawMessage(rawMessage);
      if (messageOrError instanceof Error) {
        return this.#catchFn(messageOrError, this.#socket);
      }
      const { type, data } = messageOrError;
      this.emit(type, this.#socket, data);
    };
  }

  catch(handler = (error, socket) => {}) {
    this.#catchFn = handler;
  }

  /**
   * @param {EventType} eventType
   * @param {EventHandler} handler
   */
  on(eventType, handler) {
    if (!this.#listeners[eventType]) {
      this.#listeners[eventType] = [];
    }
    this.#listeners[eventType].push(handler);
  }

  emit(eventType, ...args) {
    if (this.#listeners[eventType]) {
      this.#listeners[eventType].forEach((handler) => handler(...args));
    }
  }

  /**
   * @param {EventType} eventType
   * @param {{ [key: string]: any } | null} data
   */
  emitToServer(eventType, data) {
    this.#socket.emitToServer(eventType, data);
  }
}

const wsapp = new WebSocketApp(WEBSOCKET_URL);

wsapp.on(EventType.LIST_ROOMS, (data) => {
  console.log(data);
});

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
// ORIGINAL IMPL
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
/*
const ws = new WebSocket(WEBSOCKET_URL);

ws.onopen = () => {
  console.log(`ws connected`);
};

ws.onclose = (ws, event) => {
  console.log({ socket: "closed", ws, event });
};

ws.onmessage = (rawMessage) => {
  console.log({rawMessage})
  const message = JSON.parse(rawMessage?.data);
  if (!message?.type) {
    return;
  }

  switch (message.type) {
    case "ENTER_ROOM": {
      const { members, messages } = message;
      handleEnteredRoom(members, messages);
      break;
    }

    case "LIST_ROOMS": {
      handleRooms(roomsContainer, message.rooms);
      break;
    }

    // Received a list of rooms that this user can select.
    case "JOINABLE_ROOMS": {
      const { ok, rooms, error } = message;
      handleJoinableRooms(joinRoomModalRoomsContainer, ok, rooms, error);
      break;
    }

    case "CREATE_ROOM": {
      const { ok, rooms, createdRoomId, error } = message;
      handleCreatedRoom(ok, rooms, createdRoomId, error);
      break;
    }

    case "LIST_ROOM_MEMBERS": {
      handleRoomMembers(membersContainer, message.members);
      break;
    }

    // Got a chat message
    case "SEND_MESSAGE": {
      handleMessage(message);
      break;
    }

    // Someone entered the room
    case "member_entered": {
      handleMemberEntered(message?.id);
      break;
    }

    // Someone left the room we are currently in
    case "member_left": {
      handleMemberLeft(message?.id);
      break;
    }

    case "joined": {
      const { ok, error, rooms, joinedRoomId } = message;
      handleJoinedRoom(ok, rooms, joinedRoomId, error);
      break;
    }

    // You unjoined a room
    case "unjoin": {
      // { ok: bool, rooms?: <if ok, list of updated rooms to render>, error?: <if !ok, error will be here> }
      const { ok, rooms, error } = message;
      handleUnjoined(ok, rooms, error);
      break;
    }

    case "get_direct_conversations": {
      const { ok, conversations, isActive, error } = message;
      handleDirectConversations(ok, conversations, error, directMessagesDrawerContainer);
      break;
    }

    default: {
      break;
    }
  }
};
*/
