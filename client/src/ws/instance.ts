import { WebSocketEvents } from ".";
import WebSocketeer from "./WebSocketeer";

const url = `${document.location.protocol.replace("http", "ws")}//${document.location.host}`;
const instance = new WebSocketeer<WebSocketEvents>(url);
export default instance;
