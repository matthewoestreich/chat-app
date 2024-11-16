import RTChatError from "./RTChatError.js";

export default class RTChatUnauthorizedError extends RTChatError {
  constructor() {
    super("Unauthorized", 401, 401);
    this.name = "RTChatUnauthorizedError";
  }
}
