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
  LIST_INVITABLE_USERS: "LIST_INVITABLE_USERS",
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
