import React, { ReactNode, useMemo } from "react";
import WebSocketeer from "./WebSocketeer";
import WebSocketeerContext from "./WebSocketeerContext";

interface WebSocketeerProviderProperties {
  children: ReactNode;
  url?: string;
}

export default function WebSocketeerProvider<T extends WebSocketeerEventMap>(props: WebSocketeerProviderProperties): React.JSX.Element {
  console.log("websocketeer provider fired");
  const websocketeer = useMemo(() => {
    console.log({ from: "WebSocketeerProvider", action: "new WebSocketeer instance" });
    if (props.url === undefined) {
      return new WebSocketeer<T>(`${document.location.protocol.replace("http", "ws")}//${document.location.host}`);
    }
    return new WebSocketeer<T>(props.url);
  }, [props.url]);

  return <WebSocketeerContext.Provider value={{ websocketeer }}>{props.children}</WebSocketeerContext.Provider>;
}
