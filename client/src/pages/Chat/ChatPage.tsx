import React, { useState } from "react";
import { SingletonWebSocketeer as websocketeer } from "@client/ws";
import { useEffectOnce } from "@hooks";
import { LoadingSpinner } from "@components";
import ChatView from "./ChatView";

export default function ChatPage(): React.JSX.Element {
  const [rooms, setRooms] = useState<IRoom[] | null>(null);
  document.title = "RTChat | Chat";

  useEffectOnce(() => {
    websocketeer.connect();
  });

  websocketeer.on("LIST_ROOMS", ({ rooms, error }) => {
    if (error) {
      return console.error(error);
    }
    setRooms(rooms);
  });

  if (rooms === null) {
    return <LoadingSpinner />;
  }
  return <ChatView rooms={rooms} />;
}
