import { WebSocketEvents, WebSocketeer } from ".";

/**
 * This is so we can have a single instance across our app.
 */

const url = `${document.location.protocol.replace("http", "ws")}//${document.location.host}`;
const instance = new WebSocketeer<WebSocketEvents>(url);
export default instance;
