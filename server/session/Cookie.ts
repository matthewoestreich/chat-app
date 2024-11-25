import { Response, CookieOptions as ExpressCookieOptions } from "express";

export default class Cookie implements ICookie {
  private _options: ICookieOptions;
  get options() {
    return this._options;
  }

  private _name: string;
  get name() {
    return this._name;
  }

  private _value: string;
  get value() {
    return this._value;
  }

  constructor(name: string, value: string, options: ICookieOptions) {
    this._name = name;
    this._value = value;
    this._options = options;
  }

  set(res: Response) {
    res.cookie(this.name, this.value, this._options as ExpressCookieOptions);
  }

  remove(res: Response) {
    res.clearCookie(this.name, this._options as ExpressCookieOptions);
  }
}

export class CookieOptions implements ICookieOptions {
  expires?: Date;
  maxAge?: number;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: CookieSameSiteOption;

  constructor(options: ICookieOptions) {
    this.expires = options.expires;
    this.maxAge = options.maxAge;
    this.path = options.path;
    this.domain = options.domain;
    this.secure = options.secure;
    this.sameSite = options.sameSite;
  }
}
