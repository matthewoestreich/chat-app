declare namespace Express {
  export interface Application {
    listenAsync(port: number, hostname: string, backlog: number): Promise<import("node:http").Server<typeof import("node:http").IncomingMessage, typeof import("node:http").ServerResponse>>;
    listenAsync(port: number, hostname: string): Promise<import("node:http").Server<typeof import("node:http").IncomingMessage, typeof import("node:http").ServerResponse>>;
    listenAsync(port: number): Promise<import("node:http").Server<typeof import("node:http").IncomingMessage, typeof import("node:http").ServerResponse>>;
    listenAsync(): Promise<import("node:http").Server<typeof import("node:http").IncomingMessage, typeof import("node:http").ServerResponse>>;
    listenAsync(path: string): Promise<import("node:http").Server<typeof import("node:http").IncomingMessage, typeof import("node:http").ServerResponse>>;
    // eslint-disable-next-line
    listenAsync(handle: any, listeningListener?: () => void): Promise<import("node:http").Server<typeof import("node:http").IncomingMessage, typeof import("node:http").ServerResponse>>;
  }
  export interface Request {
    user: AuthenticatedUser | null;
    databaseProvider: DatabaseProvider;
    cookies: Cookies;
    sessionToken: string;
  }
}
