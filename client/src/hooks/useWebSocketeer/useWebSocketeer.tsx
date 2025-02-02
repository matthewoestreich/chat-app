import WebSocketeer from "@client/ws/WebSocketeer";
import { useMemo } from "react";

export default function useWebSocketeer<T extends WebSocketeerEventMap>(url: string): WebSocketeer<T> {
  return useMemo(() => new WebSocketeer<T>(url), [url]);
}
