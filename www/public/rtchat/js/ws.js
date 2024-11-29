// Add "emit" to WebSocket proto
/*
WebSocket.prototype.emitToServer = function (eventName, ...args) {
  this.send(JSON.stringify({ eventName, payload }));
};
class WebSocketApp {
  constructor(webSocketUrl) {
    if (!webSocketUrl) {
      throw new Error(`WebSocketApp : webSocketUrl is required!`);
    }
    this.ws = new WebSocket(webSocketUrl);
    this.listeners = {};
  }

  _initWebSocket() {}

  on(eventName, listener) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName].push(listener);
  }

  emit(eventName, ...args) {
    if (this.listeners[eventName]) {
      this.listeners[eventName].forEach((listener) => listener(...args));
    }
  }

  emitToServer(eventType, ...args) {
    this.ws.emitToServer(eventType, ...args);
  }
}
*/
const ws = new WebSocket(WEBSOCKET_URL);

ws.onopen = () => {
  console.log(`ws connected`);
};

ws.onclose = (ws, event) => {
  console.log({ socket: "closed", ws, event });
};

ws.onmessage = (rawMessage) => {
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
      console.log("in list rooms");
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
