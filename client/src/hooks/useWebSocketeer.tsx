import { useContext } from "react";
import WebSocketeerContext from "../ws/WebSocketeerContext";
import { WebSocketEvents } from "../ws";

function useCreateWebSocketeerHook<T extends WebSocketeerEventMap>(): WebSocketeerContextValue<T> {
  const context = useContext(WebSocketeerContext) as WebSocketeerContextValue<T>;
  if (!context) {
    throw new Error("useWebSocketeer must be used within a WebSocketeerProvider");
  }
  return context;
}

// Create a 'typed' hook for this specific use. Otherwise we would have to specify our
// WebSocketEvents each time we used the hook (`useWebSocketeer<YourEvents>()`).
export default function useWebSocketeer(): WebSocketeerContextValue<WebSocketEvents> {
  return useCreateWebSocketeerHook<WebSocketEvents>();
}
