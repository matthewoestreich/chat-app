import { WebSocket } from "ws";
import WebSocketApp from "../../../server/wss/WebSocketApp";
import WebSocketClient from "../../../server/wss/WebSocketClient";
import { IncomingMessage } from "node:http";
import { EventTypeMissingError } from "../../../server/errors";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("WebSocketApp", () => {
  let APP: WebSocketApp;
  let SOCKET: WebSocket;
  let CLIENT: WebSocketClient;
  let INCOMING_MESSAGE: IncomingMessage;

  const USER = {
    name: "Foo",
    id: "1",
    email: "foo@foo.com",
    password: "pw",
  };

  beforeEach(async () => {
    APP = new WebSocketApp();
    APP.listen({ port: 8080 }, () => {
      /* console.log("WebSocketApp listening...") */
    });

    // Create socket for client
    SOCKET = new WebSocket("ws://localhost:8080");
    // Create an instance of the mocked WebSocketClient
    CLIENT = new WebSocketClient(SOCKET);
    CLIENT.user = { ...USER };

    // @ts-ignore
    APP.on("CONNECTION_ESTABLISHED", (client, { request }) => {
      client.user = USER;
    });

    INCOMING_MESSAGE = new IncomingMessage(null as any);
    INCOMING_MESSAGE.headers = { host: "localhost" };
    INCOMING_MESSAGE.method = "GET";
    INCOMING_MESSAGE.url = "/";

    await waitForConnection();

    function waitForConnection() {
      let count = 0;
      return new Promise(async (resolve, reject) => {
        while (CLIENT.socket.readyState !== CLIENT.socket.OPEN) {
          count++;
          //console.log("waiting...");
          await sleep(500);
          if (count === 6) {
            reject("client took too long!");
          }
        }
        //console.log("client connected");
        resolve(true);
      });
    }
  });

  afterEach(async () => {
    APP.shutdown();
    if (CLIENT.socket.readyState === CLIENT.socket.OPEN) {
      CLIENT.socket.close();
    }
  });

  it("should handle client connection and emit CONNECTION_ESTABLISHED", (done) => {
    // @ts-ignore
    APP.on("CONNECTION_ESTABLISHED", (client, { request }) => {
      expect(client).toBe(CLIENT);
      done();
    });
    // Simulate the connection event
    APP.emit("CONNECTION_ESTABLISHED", CLIENT, { request: INCOMING_MESSAGE });
  });

  it("should handle incoming message and emit the correct event", (done) => {
    APP.on("SEND_MESSAGE", (client, { message }) => {
      expect(client.user.id).toEqual(CLIENT.user.id);
      expect(message).toBe("hello");
      done();
    });
    // Simulate the message event
    CLIENT.send("SEND_MESSAGE", { message: "hello" });
  });

  it("should add client to cache", (done) => {
    const containerId = "room1";
    APP.addClientToCache(CLIENT, containerId);
    const cachedContainer = APP.getCachedContainer(containerId);
    expect(cachedContainer.size).toBe(1);
    expect(APP.isItemCached(CLIENT.user.id)).toBe(true);
    expect(cachedContainer.has(CLIENT.user.id)).toBe(true);
    done();
  });

  it("should handle error if message type is missing", (done) => {
    APP.catch((error) => {
      expect(error).toBeInstanceOf(EventTypeMissingError);
      done();
    });
    CLIENT.socket.send(JSON.stringify({ foo: "bar" }));
  });
});
