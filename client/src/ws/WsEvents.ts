import { WebSocketAppEventRegistry } from "@root/types.shared";
import { WebSocketeerEventMap } from "@client/types";

export interface WsEvents extends WebSocketeerEventMap, WebSocketAppEventRegistry {}
