import React from "react";
import Topbar from "@pages/Topbar";
import { websocketeer, WebSocketEvents } from "@src/ws";
import { useChat, useEffectOnce } from "@hooks";
import { LoadingSpinner } from "@components";
import ChatView from "./ChatView";
import { WebSocketeerEventHandler } from "@client/types";
import sortMembers from "./sortMembers";

export default function ChatPage(): React.JSX.Element {
  document.title = "RTChat | Chat";

  const { state, dispatch } = useChat();

  useEffectOnce(() => {
    websocketeer.connect();

    const handleConnectionEstablished: WebSocketeerEventHandler<WebSocketEvents, "CONNECTED"> = ({
      rooms,
      directConversations,
      defaultRoom,
      error,
    }) => {
      if (error) {
        return console.error(error);
      }
      dispatch({
        type: "AFTER_CONNECTION_ESTABLISHED",
        payload: {
          rooms,
          directConversations: sortMembers(directConversations, true),
          defaultRoom,
        },
      });
    };

    websocketeer.on("CONNECTED", handleConnectionEstablished);

    return (): void => {
      websocketeer.off("CONNECTED", handleConnectionEstablished);
    };
  });

  if (state.rooms === null) {
    return (
      <>
        <Topbar />
        <LoadingSpinner />
      </>
    );
  }
  return <ChatView />;
}
