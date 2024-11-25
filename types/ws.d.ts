import * as _ from "ws";

declare module "ws" {
  export interface WebSocket {
    user?: Account;
    activeIn?: string;
    id?: string;
    chatColor?: string;
  }
}
