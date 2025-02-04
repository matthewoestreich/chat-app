import React, { CSSProperties, memo, useCallback, useEffect, useState } from "react";
import { Member } from "@components";
import websocketeer from "../../ws/instance";
import JoinDirectConversationModal from "./JoinDirectConversationModal";

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
  const [isJoinDirectConversationModalOpen, setIsDirectConversationModalOpen] = useState(false);
  const [conversations, setConversations] = useState<DirectConversationByUserId[] | null>(null);

  useEffect(() => {
    if (isShown) {
      websocketeer.send("GET_DIRECT_CONVERSATIONS");
    }
  }, [isShown]);

  websocketeer.on("LIST_DIRECT_CONVERSATIONS", ({ directConversations, error }) => {
    if (error) {
      return console.error(error);
    }
    setConversations(directConversations);
  });

  function handleOpenJoinDirectConversationModal(): void {
    setIsDirectConversationModalOpen(true);
  }

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleCloseDirectConversationModal = useCallback(() => {
    setIsDirectConversationModalOpen(false);
  }, []);

  const renderConversations = useCallback(() => {
    if (!conversations) {
      return;
    }
    return conversations.map((convo) => <MemberMemo key={convo.id} isButton={true} memberName={convo.userName} isOnline={convo.isActive || false} />);
  }, [conversations]);

  return (
    <>
      <JoinDirectConversationModal isOpen={isJoinDirectConversationModalOpen} onClose={handleCloseDirectConversationModal} />
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
    </>
  );
}
