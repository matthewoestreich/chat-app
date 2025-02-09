import React, { ChangeEvent, memo, useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Member, Modal, ModalBody, ModalContent, ModalDialog, ModalFooter, ModalHeader, ModalTitle } from "@components";
import { websocketeer, WebSocketEvents } from "@src/ws";
import sortMembers from "./sortMembers";
import { PublicMember } from "@root/types.shared";
import { AlertState, WebSocketeerEventHandler } from "@client/types";
import { useChat } from "@hooks";

interface CreateDirectConversationModalProperties {
  isOpen: boolean;
  onClose: () => void;
}

const MemberMemo = memo(Member);

export default function CreateDirectConversationModal(props: CreateDirectConversationModalProperties): React.JSX.Element {
  const { dispatch } = useChat();
  const [alert, setAlert] = useState<AlertState>({ type: null, shown: false, icon: null });
  const [joinableDirectConversations, setJoinableDirectConversations] = useState<PublicMember[] | null>(null);
  const [selectedUser, setSelectedUser] = useState<PublicMember | null>(null);
  const [searchText, setSearchText] = useState("");

  const { isOpen, onClose } = props;

  useEffect(() => {
    if (isOpen === true) {
      websocketeer.send("GET_JOINABLE_DIRECT_CONVERSATIONS");
    }

    const handleListJoinableDirectConvos: WebSocketeerEventHandler<WebSocketEvents, "LIST_JOINABLE_DIRECT_CONVERSATIONS"> = ({
      conversations,
      error,
    }) => {
      if (error) {
        return console.error(error);
      }
      if (!isOpen) {
        return;
      }
      setJoinableDirectConversations(sortMembers(conversations, true));
    };

    const handleCreatedDirectConversation: WebSocketeerEventHandler<WebSocketEvents, "CREATED_DIRECT_CONVERSATION"> = ({
      joinableDirectConversations,
      directConversations,
      error,
    }) => {
      if (error) {
        setAlert({ type: "danger", message: "Something went wrong!", shown: true, icon: "bi-emoji-frown-fill" });
        return console.error(error);
      }
      // If we got this event while modal is closed, it most likely means a convo was created elsewhere, so let them handle the event.
      if (!isOpen) {
        return;
      }
      setJoinableDirectConversations(joinableDirectConversations);
      dispatch({ type: "SET_DIRECT_CONVERSATIONS", payload: directConversations });
      setAlert({ type: "success", message: "Success!", shown: true, icon: "bi-emoji-smile-fill" });
    };

    websocketeer.on("LIST_JOINABLE_DIRECT_CONVERSATIONS", handleListJoinableDirectConvos);
    websocketeer.on("CREATED_DIRECT_CONVERSATION", handleCreatedDirectConversation);

    return (): void => {
      websocketeer.off("LIST_JOINABLE_DIRECT_CONVERSATIONS", handleListJoinableDirectConvos);
      websocketeer.off("CREATED_DIRECT_CONVERSATION", handleCreatedDirectConversation);
    };
  }, [isOpen, dispatch]);

  const handleJoinDirectConversationClick = useCallback(() => {
    if (selectedUser === null) {
      return;
    }
    websocketeer.send("CREATE_DIRECT_CONVERSATION", { withUserId: selectedUser.userId });
  }, [selectedUser]);

  function handleCloseModal(): void {
    dispatch({ type: "SET_IS_CREATE_DIRECT_CONVERSATION_MODAL_OPEN", payload: false });
    onClose();
    setAlert({ type: null, message: "", shown: false, icon: "" });
    setSearchText("");
    setJoinableDirectConversations(null);
  }

  function handleCloseAlert(): void {
    setAlert({ type: null, icon: null, message: "", shown: false });
  }

  function handleSearchInput(e: ChangeEvent<HTMLInputElement>): void {
    setSearchText(e.target.value);
  }

  // prettier-ignore
  const handleJoinableConversationClick = useCallback((user: PublicMember) => {
    setSelectedUser(user);
  }, []);

  // If we don't cache click handlers, rooms rerender a lot due to `onClick` being recreated.
  const joinableConversationClickHandlers = useMemo(() => {
    return new Map(joinableDirectConversations?.map((user) => [user.userId, (): void => handleJoinableConversationClick(user)]));
  }, [joinableDirectConversations, handleJoinableConversationClick]);

  // prettier-ignore
  const renderJoinableConversations = useCallback(() => {
    console.log("rendering members")
    return joinableDirectConversations?.filter((user) => user.userName.includes(searchText)).map((user) => (
      <MemberMemo 
        key={user.userId} 
        isButton={true} 
        onClick={joinableConversationClickHandlers.get(user.userId)} 
        memberName={user.userName} 
        memberId={user.userId} 
        isOnline={user.isActive} 
        className={selectedUser?.userId === user.userId ? "active" : ""} 
      />
    ));
  }, [searchText, joinableDirectConversations, selectedUser?.userId, joinableConversationClickHandlers]);

  return (
    <Modal shown={props.isOpen} className="fade mh-100" tabIndex={-1} dataBsBackdrop="static" dataBsKeyboard={false}>
      <ModalDialog>
        <ModalContent>
          <ModalHeader>
            <ModalTitle as="h1" className="fs-5">
              New Direct Message
            </ModalTitle>
            <button onClick={handleCloseModal} className="btn-close" tabIndex={-1} type="button"></button>
          </ModalHeader>
          <ModalBody>
            <Alert isOpen={alert.shown} onClose={handleCloseAlert} icon={alert.icon} type={alert.type}>
              {alert.message}
            </Alert>
            <input onChange={handleSearchInput} value={searchText} className="form-control" placeholder="Search People" type="text" />
            <div className="border mt-3">
              <ul className="list-group" style={{ maxHeight: "35vh", overflowY: "scroll" }}>
                {renderJoinableConversations()}
              </ul>
            </div>
          </ModalBody>
          <ModalFooter>
            <button onClick={handleCloseModal} className="btn btn-danger" type="button">
              Close
            </button>
            <button onClick={handleJoinDirectConversationClick} className="btn btn-primary" type="button">
              Add
            </button>
          </ModalFooter>
        </ModalContent>
      </ModalDialog>
    </Modal>
  );
}
