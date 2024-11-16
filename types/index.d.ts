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

declare namespace Express {
  export interface Request {
    databasePool: DatabasePool<T>;
    cookies: {};
  }
}
