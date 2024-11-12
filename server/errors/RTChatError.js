export default class RTChatError extends Error {
  constructor(message = "", internalErrorCode = 0, httpErrorCode = 0, extraData = {}) {
    super(message);
    this.name = "RTChatError";
  }
}
