import WebSocketeer from "../../../client/src/ws/WebSocketeer";
import { WebSocketeerEventMap } from "../../../client/types";

interface TestEvents extends WebSocketeerEventMap {
  FOO: {
    foo: string;
  };
}

describe("WebSocketeer : Event Emitter Functionality", () => {
  it("should allow multiple handlers for the same event", () => {
    const wsteer = new WebSocketeer<TestEvents>("");

    const handler1 = jest.fn();
    const handler2 = jest.fn();

    wsteer.on("FOO", ({ foo }) => {
      handler1(foo);
    });
    wsteer.on("FOO", ({ foo }) => {
      handler2(foo);
    });

    wsteer.emit("FOO", { foo: "data" });

    expect(handler1).toHaveBeenCalledWith("data");
    expect(handler2).toHaveBeenCalledWith("data");
  });
});
