interface IWebSocketMessageData {
  error?: Error;
  [key: string]: any;
}

type IWebSocketMessage = {
  type: EventType;
  [key: string]: any;
};

type IWebSocketErrorHandler = (error: Error, socket: WebSocket.WebSocket) => void;

interface EnterRoomPayload {
  roomId: string;
}

interface JoinRoomPayload {
  id: string; // roomId
}

interface UnjoinRoomPayload {
  roomId: string;
}

interface CreateRoomPayload {
  name: string;
  isPrivate?: 0 | 1;
}

interface SendMessagePayload {
  roomId: string;
  messageText: string;
}

interface DirectMessagesPayload {
  id: string; // direct conversation id
}
