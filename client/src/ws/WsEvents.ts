import { WebSocketAppEventRegistry } from "../../../types.shared";
import { WebSocketeerEventMap } from "../../types";

export interface WsEvents extends WebSocketeerEventMap, WebSocketAppEventRegistry {}
