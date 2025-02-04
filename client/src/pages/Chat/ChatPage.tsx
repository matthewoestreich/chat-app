import React, { useState } from "react";
import websocketeer from "../../ws/instance";
import { useEffectOnce } from "@hooks";
import { LoadingSpinner } from "@components";
import ChatView from "./ChatView";

export default function LoadChatPage(): React.JSX.Element {
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
