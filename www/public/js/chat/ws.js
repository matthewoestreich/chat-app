/**
 * @typedef {(socket: WebSocket, data: { [key: string]: any }) => void} EventHandler
 * @typedef {(error: Error, socket: WebSocket) => void} ErrorHandler
 * @typedef {{ error?: Error, [key: string]: any }} IWebSocketMessageData
 */

const EventType = {
  ERROR: "ERROR",
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
  LIST_DIRECT_MESSAGES: "LIST_DIRECT_MESSAGES",
  MEMBER_ENTERED_ROOM: "MEMBER_ENTERED_ROOM",
  MEMBER_LEFT_ROOM: "MEMBER_LEFT_ROOM",
  CONNECTION_ESTABLISHED: "CONNECTION_ESTABLISHED",
  CONNECTION_CLOSED: "CONNECTION_CLOSED",
};

class WebSocketMessage {
  /** @type {EventType} */
  type = undefined;
  // Allowed to put any prop on this object:
  // [k:string]: any;

  /**
   * Parses RawData from WebSocket into WebSocketMessage.
   * @param {ArrayBuffer | Buffer[] | string} data
   * @returns {WebSocketMessage}
   */
  static from(data) {
    const { type, ...rest } = JSON.parse(String(data));
    return new WebSocketMessage(type, rest);
  }

  /**
   * @param {EventType} type
   * @param {IWebSocketMessageData} data
   */
  constructor(type, data) {
    this.type = type;
    Object.assign(this, data);
  }

  toJSONString() {
    return JSON.stringify(this);
  }
}

class WebSocketApp {
  /** @type {WebSocket} */
  #socket;
  /** @type {{ [key: string]: EventHandler }} */
  #events;
  /** @param {ErrorHandler} handler */
  #catchFn = () => {};

  #parseRawMessage = (rawMessage) => {
    if (!rawMessage?.data) {
      throw new Error(`[ws][parseRawMessage] No data found on message.`);
    }
    const message = WebSocketMessage.from(rawMessage.data);
    if (!message?.type) {
      throw new Error(`[ws][parseRawMessage] No type found in message.`);
    }
    if (!(message.type in EventType)) {
      throw new Error(`[ws][parseRawMessage] Message type not recognized. Got : '${message.type}'`);
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
    this.#events = {};

    this.#socket.onopen = () => {
      console.log(`ws connected`);
    };

    this.#socket.onclose = (ws, event) => {
      console.log({ socket: "closed", ws, event });
    };

    this.#socket.onmessage = (rawMessage) => {
      try {
        const { type, ...data } = this.#parseRawMessage(rawMessage);
        console.log("received", { type, ...data });
        this.emit(type, this.#socket, data);
      } catch (e) {
        this.#catchFn(e, this.#socket);
      }
    };
  }

  /**
   * Explicit error handling (as opposed to emitting an 'ERROR' event).
   * @param {ErrorHandler} handler
   */
  catch(handler) {
    this.#catchFn = handler;
  }

  /**
   * @param {EventType} eventType
   * @param {EventHandler} handler
   */
  on(eventType, eventHandler) {
    if (!this.#events[eventType]) {
      this.#events[eventType] = [];
    }
    this.#events[eventType].push(eventHandler);
  }

  emit(eventType, ...args) {
    try {
      if (!this.#events[eventType]) {
        throw new Error(`Event not found : ${eventType}`);
      }
      this.#events[eventType].forEach((eventHandler) => eventHandler(...args));
    } catch (e) {
      this.#catchFn(e, this.#socket);
    }
  }

  /**
   * Sends a WebSocket message to the server.
   * @param {WebSocketMessage} message
   */
  send(message) {
    console.log("send", { ...message });
    this.#socket.send(message.toJSONString());
  }
}

const wsapp = new WebSocketApp(WEBSOCKET_URL);

wsapp.catch((error) => {
  console.error(`[wsapp][ERROR]`, error);
});

wsapp.on(EventType.SEND_MESSAGE, (_socket, { userId, userName, messageText }) => {
  handleMessage(userName, messageText, userId);
});

/**
 *
 * @event {ENTER_ROOM}
 *
 */
wsapp.on(EventType.ENTER_ROOM, (_, { error, members, messages }) => {
  if (error) {
    throw error;
  }
  handleEnteredRoom(members, messages);
});

/**
 *
 * @event {LIST_ROOMS}
 *
 */
wsapp.on(EventType.LIST_ROOMS, (_socket, { error, rooms }) => {
  if (error) {
    throw error;
  }
  handleRooms(roomsContainer, rooms);
});

/**
 *
 * @event {JOIN_ROOM}
 *
 */
wsapp.on(EventType.JOIN_ROOM, (_socket, { error, rooms }) => {
  if (error) {
    throw error;
  }
  handleJoinedRoom(rooms);
});

/**
 *
 * @event {UNJOIN_ROOM}
 *
 */
wsapp.on(EventType.UNJOIN_ROOM, (_socket, { error, rooms }) => {
  if (error) {
    throw error;
  }
  handleUnjoined(rooms);
});

/**
 *
 * @event {LIST_JOINABLE_ROOMS}
 *
 */
wsapp.on(EventType.LIST_JOINABLE_ROOMS, (_socket, { error, rooms }) => {
  if (error) {
    throw error;
  }
  handleJoinableRooms(joinRoomModalRoomsContainer, rooms);
});

/**
 *
 * @event {CREATE_ROOM}
 *
 */
wsapp.on(EventType.CREATE_ROOM, (_socket, { error, id, rooms }) => {
  if (error) {
    throw error;
  }
  handleCreatedRoom(rooms, id);
});

/**
 *
 * @event {LIST_ROOM_MEMBERS}
 *
 */
wsapp.on(EventType.LIST_ROOM_MEMBERS, (_socket, { error, members }) => {
  if (error) {
    throw error;
  }
  handleRoomMembers(membersContainer, members);
});

/**
 *
 * @event {MEMBER_ENTERED_ROOM}
 *
 */
wsapp.on(EventType.MEMBER_ENTERED_ROOM, (_socket, { id }) => {
  handleMemberEntered(id);
});

/**
 *
 * @event {MEMBER_LEFT_ROOM}
 *
 */
wsapp.on(EventType.MEMBER_LEFT_ROOM, (_socket, { id }) => {
  handleMemberLeft(id);
});

wsapp.on(EventType.LIST_DIRECT_CONVERSATIONS, (_socket, { error, directConversations }) => {
  if (error) {
    throw error;
  }
  handleDirectConversations(directConversations, directMessagesDrawerContainer);
});

wsapp.on(EventType.LIST_DIRECT_MESSAGES, (_socket, { messages, error }) => {
  if (error) {
    throw error;
  }
  handleDirectMessages(messages);
});
