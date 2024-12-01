interface IRTChatErrorOptions {
  message: string;
  internalErrorCode?: number;
  httpErrorCode?: number;
  data?: { [key: string]: any };
}
