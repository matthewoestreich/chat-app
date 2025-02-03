import { createContext } from "react";

export default createContext<WebSocketeerContextValue<WebSocketeerEventMap> | undefined>(undefined);
