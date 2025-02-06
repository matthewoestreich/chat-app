import React from "react";
import { SingletonWebSocketeer as websocketeer } from "@client/ws";
import { useChat, useEffectOnce } from "@hooks";
import { LoadingSpinner } from "@components";
import ChatView from "./ChatView";

export default function ChatPage(): React.JSX.Element {
  document.title = "RTChat | Chat";

  const { state, dispatch } = useChat();

  useEffectOnce(() => {
    websocketeer.connect();
  });

  websocketeer.on("LIST_ROOMS", ({ rooms, error }) => {
    if (error) {
      return console.error(error);
    }
    dispatch({ type: "SET_ROOMS", payload: rooms });
  });

  if (state.rooms === null) {
    return <LoadingSpinner />;
  }
  return <ChatView />;
}
