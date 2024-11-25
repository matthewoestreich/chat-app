import Session from "./Session";

export default class MemoryStore implements ISessionStore {
  private _store: Map<string, Session> = new Map<string, Session>();

  constructor() {}

  remove() {}

  get(sessionId: string): string {
    return "";
  }

  set() {}

  touch() {}
}
