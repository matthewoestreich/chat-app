export default class RTChatError extends Error {
  internalErrorCode?: number;
  httpErrorCode?: number;
  data?: { [key: string]: any };

  constructor(options: IRTChatErrorOptions) {
    super(options.message);
    this.internalErrorCode = options.internalErrorCode;
    this.httpErrorCode = options.httpErrorCode;
    this.data = options.data;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class EventTypeMissingError extends RTChatError {}
export class EventTypeUnknownError extends RTChatError {}
export class RTChatUnauthorizedError extends RTChatError {}
