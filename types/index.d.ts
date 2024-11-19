interface DatabasePoolConnection<T> {
  db: T;
  release(): void;
}

interface DatabasePool<T> {
  getConnection(): Promise<DatabasePoolConnection<T>>;
  releaseConnection(connection: DatabasePoolConnection<T>): void;
  query(sql: string, params: any): Promise<unknown>;
  closeAllIdleConnections(): Promise<boolean>;
}

interface SessionToken {
  id: string;
  name: string;
  email: string;
}

interface Session {
  token: string;
  userId: string;
}

interface Account {
  name: string;
  id: string;
  email: string;
  password?: string;
}

interface RoomWithMembers {
  id: string;
  name: string;
  members: Account[];
}

interface Room {
  id: string;
  name: string;
}

declare namespace Express {
  export interface Request {
    databasePool: DatabasePool<T>;
    cookies: {};
    sessionToken: string;
  }
}

type WsApplication = {
  socket: WebSocket.WebSocket;
  handlers: WsMessageTypeHandler;
  databasePool: DatabasePool<T>;
  account: Account;
  on(type: AllowedWsMessageTypes, handler: WsRouteHandler): void;
  catch(handler: WsRouteHandler): void;
  sendMessage(message: WsMessage): void;
};

interface WebSocketApplicationOptions {
  socket: WebSocket.WebSocket;
  databasePool: DatabasePool<T>;
  account: Account;
}

interface WsMessage {
  type: AllowedWsMessageTypes;
  data: WsMessageData;
}

interface WsMessageData {
  [k: string]: any;
}

interface IncomingWsMessage {
  parse(message: WebSocket.RawData): WsMessage;
}

type AllowedWsMessageTypes = "send_broadcast" | "get_rooms" | "get_room_members" | "general";

type WsMessageTypeHandler = { [k in AllowedWsMessageTypes]?: WsRouteHandler };

type WsRouteHandler = (thisApp: WebSocketApplication, data: WsMessageData) => void;
