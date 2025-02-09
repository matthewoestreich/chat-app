import React, { CSSProperties, memo, useCallback, useEffect, useMemo } from "react";
import { Member } from "@components";
import { websocketeer, WebSocketEvents } from "@src/ws";
import { useChat } from "@hooks";
import { ChatScope, PublicDirectConversation } from "@root/types.shared";
import { WebSocketeerEventHandler } from "../../../types";

// TODO pull this out and make a standalone drawer component

const styles: Record<string, CSSProperties> = {
  drawer: {
    position: "absolute",
    top: 0,
    left: "-100vw", // hidden by default
    height: "100%",
    width: "100%",
    transition: "left 0.3s ease-in-out",
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
  },
  open: {
    left: 0,
  },
  header: {
    padding: "1rem",
  },
  body: {
    flexGrow: 1,
    padding: "1rem",
    overflowY: "auto",
  },
  container: {
    position: "relative",
    overflow: "hidden",
  },
  closeButton: {
    zIndex: 2,
    position: "absolute",
    top: 0,
    right: 0,
    padding: "0.75rem",
  },
};

const MemberMemo = memo(Member);

interface DirectMessagesDrawerProperties {
  isShown: boolean;
  onClose: () => void;
}

export default function DirectMessagesDrawer(props: DirectMessagesDrawerProperties): React.JSX.Element {
  const { isShown, onClose } = props;
  const { state, dispatch } = useChat();

  useEffect(() => {
    // TODO should the server send us this info upon a joined direct convo???
    const handleJoinedDirectConversation: WebSocketeerEventHandler<WebSocketEvents, "JOINED_DIRECT_CONVERSATION"> = ({
      directConversationId,
      directConversations,
      withUserId,
      error,
    }) => {
      if (error) {
        return console.error(error);
      }
      const member = state.members?.find((member) => member.userId === withUserId);
      if (!member) {
        return;
      }
      const scope: ChatScope = {
        id: directConversationId,
        userId: member.userId,
        userName: member.userName,
        type: "DirectConversation",
        scopeName: member.userName,
      };
      dispatch({ type: "JOINED_DIRECT_CONVERSATION", payload: { directConversations, scope, isDirectMessagesDrawerShown: true } });
      websocketeer.send("GET_DIRECT_MESSAGES", { scopeId: scope.id });
    };

    websocketeer.on("JOINED_DIRECT_CONVERSATION", handleJoinedDirectConversation);

    return (): void => {
      console.log("[ChatState]::cleaning up useEffect with deps : '[dispatch, state.members]'");
      websocketeer.off("JOINED_DIRECT_CONVERSATION", handleJoinedDirectConversation);
    };
  }, [dispatch, state.members]);

  const handleOpenJoinDirectConversationModal = useCallback(() => {
    dispatch({ type: "SET_IS_JOIN_DIRECT_CONVERSATION_MODAL_SHOWN", payload: true });
  }, [dispatch]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // prettier-ignore
  const handleDirectConversationClick = useCallback((directConvo: PublicDirectConversation) => {
    // ChatView page will take care of handling "LIST_DIRECT_MESSAGES" event as well as rendering the messages.
    const chatScope: ChatScope = {
      scopeName: directConvo.userName,
      id: directConvo.scopeId,
      userId: directConvo.userId,
      userName: directConvo.userName,
      type: "DirectConversation",
    };
    dispatch({ type: "SET_CHAT_SCOPE", payload: chatScope });
    websocketeer.send("GET_DIRECT_MESSAGES", { scopeId: directConvo.scopeId });
  }, [dispatch]);

  const directConversationClickHandlers = useMemo(() => {
    return new Map(state.directConversations?.map((dc) => [dc.scopeId, (): void => handleDirectConversationClick(dc)]));
  }, [state.directConversations, handleDirectConversationClick]);

  const renderConversations = useCallback(() => {
    if (!state.directConversations) {
      console.log("[DirectMessagesDrawer]::renderConversations : no 'state.directConversations' found");
      return;
    }
    console.log("[DirectMessagesDrawer]::renderConversations : found 'state.directConversations'", { dcs: state.directConversations });
    return state.directConversations.map((convo) => {
      return (
        <MemberMemo
          key={convo.scopeId}
          isButton={true}
          onClick={directConversationClickHandlers.get(convo.scopeId)}
          memberName={convo.userName}
          isOnline={convo.isActive}
          isSelected={state.chatScope?.id === convo.scopeId}
        />
      );
    });
  }, [state.directConversations, directConversationClickHandlers, state.chatScope?.id]);

  return (
    <div className="card" style={isShown ? { ...styles.drawer, ...styles.open } : styles.drawer}>
      <div className="card-header fs-3" style={styles.header}>
        <div className="flex-fill text-center">Direct Messages</div>
        <button onClick={handleClose} className="btn btn-close btn-sm" type="button" style={styles.closeButton}></button>
      </div>
      <div className="card-body" style={styles.body}>
        {/* prettier-ignore */}
        <ul className="list-group list-group-flush">
            {renderConversations()}
          </ul>
      </div>
      <div className="card-footer">
        <div className="row">
          <div className="col-4 d-flex p-1">
            <button onClick={handleOpenJoinDirectConversationModal} className="btn btn-success shadow flex-grow-1" type="button" title="New">
              <i className="bi bi-person-plus-fill"></i>
            </button>
          </div>
          <div className="col-4 d-flex p-1">
            <button className="btn btn-warning shadow flex-grow-1" type="button" title="Leave">
              <i className="bi bi-person-dash-fill"></i>
            </button>
          </div>
          <div className="col-4 d-flex p-1">
            <button onClick={handleClose} className="btn btn-danger shadow flex-grow-1" type="button" title="Close Direct Messages">
              <i className="bi bi-x-square"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
