interface IRTChatErrorOptions {
  message: string;
  internalErrorCode?: number;
  httpErrorCode?: number;
  // eslint-disable-next-line
  data?: { [key: string]: any };
}
