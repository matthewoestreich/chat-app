type CookieSameSiteOption = "Strict" | "Lax" | "None";

interface ICookieOptions {
  expires?: Date;
  maxAge?: number;
  path?: string;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: CookieSameSiteOption;
}

interface ICookie {
  name: string;
  value: string;
  options: ICookieOptions;
  set(response: Express.Response): void;
}

// sql table schema
interface ISessionSchema {
  id: string; // uuid
  userId: string; // uuid
  data: string; // json string?
  createdAt: Date;
  expiresAt: Date;
  lastAccessedAt: Date;
  isActive: boolean;
}

interface ISessionStore {
  remove(sessionId: string): void;
  get(sessionId: string): string;
  set(sessionId: string): void;
  touch(sessionId: string, session: Session.Session): void;
  clear?(): void; // remove all sessions from store
  size?(): number; // get number of sessions in store
}

interface ISessionOptions {
  secret: string;
  id?: string;
  name?: string;
  proxy?: string;
  saveOnCreation?: boolean; // saveUninitialized
  cookie?: ICookieOptions;
  store?: ISessionStore;
  //data?: Record<string, any>;
  generateId?(): string;
}
