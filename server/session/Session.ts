import { Request, Response, NextFunction } from "express";
import { v7 as uuidV7 } from "uuid";
import MemoryStore from "./MemoryStore";

const defaults = {
  name: "rtc.sid",
  saveOnCreation: true,
  cookieOptions: {
    path: "/",
    httpOnly: true,
    secure: false,
  },
  store: {
    inMemory: () => new MemoryStore(),
  },
  generateId: () => uuidV7(),
};

export default class Session {
  private _id: string;
  private _name: string;
  private _proxy?: string;
  private _saveOnCreation: boolean; // saveUninitialized
  private _cookieOptions: ICookieOptions;
  private _secret: string;
  private _store: ISessionStore;
  private _generateId: () => string;

  data: Record<string, any> = {};

  constructor(o: ISessionOptions) {
    this._secret = o.secret;
    this._name = o.name || defaults.name;
    this._proxy = o.proxy;
    this._saveOnCreation = o.saveOnCreation || defaults.saveOnCreation;
    this._cookieOptions = o.cookie || defaults.cookieOptions;
    this._store = o.store || defaults.store.inMemory();
    this._generateId = o.generateId || defaults.generateId;
  }

  /*
      id?: string;
      name?: string;
      proxy?: string;
      saveOnCreation?: boolean; // saveUninitialized
      cookie?: ICookieOptions;
      secret?: string;
      store?: ISessionStore;
      data?: ISessionData;
      generateId?(): string;
    */

  touch() {
    this._store.touch(this._id, this);
  }

  save() {}

  get middleware() {
    const self = this;
    return function (req: Request, _res: Response, next: NextFunction): void {
      req.session = self;
      next();
    };
  }
}
