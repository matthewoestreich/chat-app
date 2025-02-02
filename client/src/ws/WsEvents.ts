export interface WsEvents extends WebSocketeerEventMap, WebSocketAppEventRegistry {
  open: {
    id: number;
  };
}
