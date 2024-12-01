interface IWebSocketMessageData {
  [key: string]: any;
}

type IWebSocketMessage = {
  type: EventType;
  error?: Error | string | undefined;
  [key: string]: any;
};

type IWebSocketErrorHandler = (error: Error, socket: WebSocket.WebSocket) => void;

interface EnterRoomPayload {
  roomId: string;
}

interface JoinRoomPayload {
  roomId: string;
}

interface UnjoinRoomPayload {
  roomId: string;
}

interface CreateRoomPayload {
  name: string;
  isPrivate?: 0 | 1;
}

interface SendMessagePayload {
  toRoomId: string;
  userId: string;
  userName: string;
  messageText: string;
}
