import React, { CSSProperties, memo, RefObject, useCallback, useEffect, useMemo } from "react";
import { Member } from "@components";
import { websocketeer, WebSocketEvents } from "@src/ws";
import { PublicDirectConversation } from "@root/types.shared";
import { WebSocketeerEventHandler } from "@client/types";
import closeOffcanvasAtOrBelowBreakpoint, { BootstrapBreakpointDetector } from "@src/closeOffcanvasAtOrBelowBreakpoint";
import { useChat } from "@hooks";

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
  offcanvasRef?: RefObject<HTMLDivElement | null>;
}

export default function DirectMessagesDrawer(props: DirectMessagesDrawerProperties): React.JSX.Element {
  const { isShown, onClose, offcanvasRef } = props;
  const { state, dispatch } = useChat();

  //useEffect(() => {}, [dispatch, state.directConversations]);

  useEffect(() => {
    const handleEnteredDirectConversation: WebSocketeerEventHandler<WebSocketEvents, "ENTERED_DIRECT_CONVERSATION"> = ({
      error,
      messages,
      directConversation,
      isProgrammatic,
    }) => {
      if (error) {
        return console.error(error);
      }
      if (isProgrammatic) {
        document.getElementById(directConversation.scopeId)?.scrollIntoView({ behavior: "smooth" });
      }
      dispatch({
        type: "ENTERED_DIRECT_CONVERSATION",
        payload: {
          messages,
          chatScope: {
            id: directConversation.scopeId,
            scopeName: directConversation.userName,
            otherParticipantUserId: directConversation.userId,
            type: "DirectConversation",
          },
        },
      });
    };

    websocketeer.on("ENTERED_DIRECT_CONVERSATION", handleEnteredDirectConversation);

    return (): void => {
      websocketeer.off("ENTERED_DIRECT_CONVERSATION", handleEnteredDirectConversation);
    };
  }, [dispatch, state.directConversations]);

  const handleOpenJoinDirectConversationModal = useCallback(() => {
    dispatch({ type: "SET_IS_CREATE_DIRECT_CONVERSATION_MODAL_OPEN", payload: true });
  }, [dispatch]);

  const handleOpenLeaveDirectConversationModal = useCallback(() => {
    dispatch({ type: "SET_IS_LEAVE_DIRECT_CONVERSATION_MODAL_OPEN", payload: true });
  }, [dispatch]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  /**
   * If screen is "md" breakpoint or below, auto close drawer after a user selects a
   * direct convo via clicking a member or clicking on convo directly.
   */
  const autoCloseDrawerOnSmallScreens = useCallback(() => {
    if (offcanvasRef !== undefined && offcanvasRef.current) {
      closeOffcanvasAtOrBelowBreakpoint(offcanvasRef, "md");
    }
    const breakpoint = new BootstrapBreakpointDetector().detect();
    // index 2 is "md" breakpoint, so "<= 2" means "md" or below.
    if (breakpoint && breakpoint.index <= 2) {
      onClose();
    }
  }, [offcanvasRef, onClose]);

  // prettier-ignore
  const handleDirectConversationClick = useCallback((directConvo: PublicDirectConversation) => {
    websocketeer.send("ENTER_DIRECT_CONVERSATION", { directConversation: directConvo, isProgrammatic: false });
    autoCloseDrawerOnSmallScreens();
  }, [autoCloseDrawerOnSmallScreens]);

  const directConversationClickHandlers = useMemo(() => {
    return new Map(state.directConversations?.map((dc) => [dc.scopeId, (): void => handleDirectConversationClick(dc)]));
  }, [state.directConversations, handleDirectConversationClick]);

  const renderConversations = useCallback(() => {
    if (!state.directConversations) {
      return;
    }
    return state.directConversations.map((convo) => {
      return (
        <MemberMemo
          id={convo.scopeId}
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
            <button
              onClick={handleOpenJoinDirectConversationModal}
              className="btn btn-success shadow flex-grow-1"
              type="button"
              title="New Direct Message"
            >
              <i className="bi bi-person-plus-fill"></i>
            </button>
          </div>
          <div className="col-4 d-flex p-1">
            <button
              onClick={handleOpenLeaveDirectConversationModal}
              disabled={state.chatScope?.type !== "DirectConversation"}
              className="btn btn-warning shadow flex-grow-1"
              type="button"
              title="Leave Direct Message"
            >
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
