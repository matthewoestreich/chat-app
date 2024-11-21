interface RoomMember {
  userName: string;
  userId: string;
  roomId: string;
}

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
  onConnected?(wsapp: WsApplication): void;
}

interface WsMessage {
  type: AllowedWsMessageTypes;
  data: any;
}

type AllowedWsMessageTypes = "send_broadcast" | "get_rooms" | "send_room_members" | "get_room_members" | "general" | "rooms";

type WsMessageTypeHandler = { [k in AllowedWsMessageTypes]?: WsRouteHandler };

type WsRouteHandler = (thisApp: WebSocketApplication, data: any) => void;
