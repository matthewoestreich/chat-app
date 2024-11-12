export default class RTChatError extends Error {
  constructor(message, internalErrorCode, httpErrorCode, extraData={}) {
    super();
  }
}