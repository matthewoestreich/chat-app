import React from "react";
import { websocketeer, WebSocketEvents } from "@src/ws";
import { useChat, useEffectOnce } from "@hooks";
import { LoadingSpinner } from "@components";
import ChatView from "./ChatView";
import { WebSocketeerEventHandler } from "@client/types";

export default function ChatPage(): React.JSX.Element {
  document.title = "RTChat | Chat";

  const { state, dispatch } = useChat();

  useEffectOnce(() => {
    websocketeer.connect();

    const handleListRooms: WebSocketeerEventHandler<WebSocketEvents, "LIST_ROOMS"> = ({ rooms, error }) => {
      if (error) {
        return console.error(error);
      }
      dispatch({ type: "SET_ROOMS", payload: rooms });
    };

    websocketeer.on("LIST_ROOMS", handleListRooms);

    return (): void => {
      console.log(`useEffectOnce in LoginPage : cleaning up`);
      websocketeer.off("LIST_ROOMS", handleListRooms);
    };
  });

  if (state.rooms === null) {
    return <LoadingSpinner />;
  }
  return <ChatView />;
}
