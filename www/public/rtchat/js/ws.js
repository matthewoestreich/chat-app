function initWebSocket(url) {
  const _ws = new WebSocket(url);

  _ws.onopen = () => {
    console.log(`ws connected`);
  };

  _ws.onclose = (ws, event) => {
    console.log({ socket: "closed", ws, event });
  };

  _ws.onmessage = (rawMessage) => {
    const message = JSON.parse(rawMessage?.data);
    if (!message?.type) {
      return;
    }

    switch (message.type) {
      case "entered_room": {
        const { members, messages } = message;
        handleEnteredRoom(members, messages);
        break;
      }

      case "rooms": {
        handleRooms(roomsContainer, message.rooms);
        break;
      }

      // Received a list of rooms that this user can select.
      case "joinable_rooms": {
        const { ok, rooms, error } = message;
        handleJoinableRooms(joinRoomModalRoomsContainer, ok, rooms, error);
        break;
      }

      case "create_room": {
        const { ok, rooms, createdRoomId, error } = message;
        handleCreatedRoom(ok, rooms, createdRoomId, error);
        break;
      }

      case "members": {
        handleRoomMembers(membersContainer, message.members);
        break;
      }

      // Got a chat message
      case "message": {
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
        const { ok, conversations, error } = message;
        handleDirectConversations(ok, conversations, error);
        break;
      }

      default: {
        break;
      }
    }
  };

  return _ws;
}
