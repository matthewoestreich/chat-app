interface IWebSocketMessageData {
  [key: string]: any;
}

interface EventData {
  [key: string]: any;
}

type IWebSocketMessage = {
  type: EventType;
  error: Error | string | undefined;
  [key: string]: any;
};
