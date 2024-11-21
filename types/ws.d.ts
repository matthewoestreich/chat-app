import * as _ from "ws";

declare module "ws" {
  export interface WebSocket {
    user?: Account;
    databasePool?: DatabasePool<T>;
    activeIn?: string;
    id?: string;
    chatColor?: string;
  }
}
