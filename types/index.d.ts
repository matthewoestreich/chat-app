type WsAppHandler = (thisApp: WsApp, data: any, req?: any, res?: any) => void;

interface IWsApp {
  socket: WebSocket.WebSocket;
  types: { [key: string]: WsAppHandler };
  databasePool: DatabasePool<T>;
  meta: { [key: string]: any }; // store misc data for this socket app
  cookies: WsCookies;
  account: Account;
  on: (type: string, handler: WsAppHandler) => void;
  sendMessage: (type: string, data: { [k: string]: any }) => void;
}

interface WsAppOptions {
  socket: WebSocket.WebSocket;
  databasePool: DatabasePool<T>;
  cookies?: WsCookies;
  onConnected?: WsAppOnInitialConnectionHandler;
}

interface WsMessageData {
  [k: any]: any;
}

interface WsAppMessage extends WsMessageData {
  type: string;
}

interface WsCookies {
  session: string;
  [k: string]: string;
}

type WsAppOnInitialConnectionHandler = (self: IWsApp) => void;

type DatabasePoolPendingRequest<T> = { resolve: (value: T | PromiseLike<T>) => void; reject: (reason?: any) => void };

interface DatabasePool<T> {
  databasePath?: string;
  maxConnections: number;
  pool: T[];
  pendingRequests: DatabasePoolPendingRequest<T>[];
  getConnection(): Promise<T>;
  releaseConnection(connection: T): void;
  query(sqlQuery: string, params: any): Promise<unknown>;
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

declare namespace Express {
  export interface Request {
    databasePool: DatabasePool<T>;
    cookies: {};
    sessionToken: string;
  }
}
