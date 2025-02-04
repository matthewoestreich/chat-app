import { useMemo } from "react";
import { WebSocketeer, WebSocketEvents } from "../ws";

export default function useWebSocketeer(): WebSocketeer<WebSocketEvents> {
  const url = `${document.location.protocol.replace("http", "ws")}//${document.location.host}`;
  return useMemo(() => {
    const wsteer = new WebSocketeer<WebSocketEvents>(url);
    wsteer.connect();
    return wsteer;
  }, [url]);
}

// Create a 'typed' hook for this specific use. Otherwise we would have to specify our
// WebSocketEvents each time we used the hook (`useWebSocketeer<YourEvents>()`).
//export default function useWebSocketeer(): WebSocketeerContextValue<WebSocketEvents> {
//  console.log("useWebSocketeer hook");
//  return useCreateWebSocketeerHook<WebSocketEvents>();
//}
