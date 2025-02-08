import WebSocketeer from "../../../client/src/ws/WebSocketeer";
import { WebSocketeerEventMap, WebSocketeerEventPayload } from "../../../client/types";

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

  it("should remove handlers with off", () => {
    const wsteer = new WebSocketeer<TestEvents>("");
    const handler1 = jest.fn();

    const handleFoo: (payload: WebSocketeerEventPayload<TestEvents, "FOO">) => void = ({ foo }) => {
      handler1(foo);
    };

    wsteer.on("FOO", handleFoo);
    wsteer.off("FOO", handleFoo);
    wsteer.emit("FOO", { foo: "data" });
    const fooHandlers = wsteer.listEventHandlers("FOO");

    expect(fooHandlers).toBe(undefined);
    expect(handler1).toHaveBeenCalledTimes(0);
  });

  it("should recreate handlers after becoming undefined", () => {
    const wsteer = new WebSocketeer<TestEvents>("");
    const handler1 = jest.fn();
    const handler2 = jest.fn();

    const handleFoo1: (payload: WebSocketeerEventPayload<TestEvents, "FOO">) => void = ({ foo }) => {
      handler1(foo);
    };
    const handleFoo2: (payload: WebSocketeerEventPayload<TestEvents, "FOO">) => void = ({ foo }) => {
      handler2(foo);
    };

    wsteer.on("FOO", handleFoo1);
    wsteer.off("FOO", handleFoo1);
    wsteer.emit("FOO", { foo: "data" });
    const fooHandlers1 = wsteer.listEventHandlers("FOO");
    wsteer.on("FOO", handleFoo2);
    const foundHandlers2 = wsteer.listEventHandlers("FOO");

    expect(fooHandlers1).toBe(undefined);
    expect(foundHandlers2?.length).toEqual(1);
  });
});
