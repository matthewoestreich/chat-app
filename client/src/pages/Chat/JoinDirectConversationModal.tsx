import React, { ChangeEvent, memo, useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Member, Modal, ModalBody, ModalContent, ModalDialog, ModalFooter, ModalHeader, ModalTitle } from "@components";
import { websocketeer, WebSocketEvents } from "@src/ws";
import sortMembers from "./sortMembers";
import { PublicMember } from "@root/types.shared";
import { AlertState, WebSocketeerEventHandler } from "@client/types";
import { useChat } from "@hooks";

interface JoinDirectConversationModalProperties {
  isOpen: boolean;
  onClose: () => void;
}

const MemberMemo = memo(Member);

export default function JoinDirectConversationModal(props: JoinDirectConversationModalProperties): React.JSX.Element {
  const { dispatch } = useChat();
  const [alert, setAlert] = useState<AlertState>({ type: null, shown: false, icon: null });
  const [users, setUsers] = useState<PublicMember[] | null>(null);
  const [selectedUser, setSelectedUser] = useState<PublicMember | null>(null);
  const [searchText, setSearchText] = useState("");

  const { isOpen, onClose } = props;

  useEffect(() => {
    if (isOpen === true) {
      websocketeer.send("GET_JOINABLE_DIRECT_CONVERSATIONS");
    }

    const handleListJoinableDirectConvos: WebSocketeerEventHandler<WebSocketEvents, "LIST_JOINABLE_DIRECT_CONVERSATIONS"> = ({ users, error }) => {
      if (error) {
        return console.error(error);
      }
      if (!isOpen) {
        return;
      }
      setUsers(sortMembers(users, true));
    };

    const handleJoinedDirectConversation: WebSocketeerEventHandler<WebSocketEvents, "JOINED_DIRECT_CONVERSATION"> = ({
      invitableUsers,
      directConversations,
      error,
    }) => {
      if (error || !isOpen) {
        return;
      }
      setUsers(sortMembers(invitableUsers, true));
      dispatch({ type: "SET_DIRECT_CONVERSATIONS", payload: directConversations });
    };

    websocketeer.on("LIST_JOINABLE_DIRECT_CONVERSATIONS", handleListJoinableDirectConvos);
    websocketeer.on("JOINED_DIRECT_CONVERSATION", handleJoinedDirectConversation);

    return (): void => {
      websocketeer.off("LIST_JOINABLE_DIRECT_CONVERSATIONS", handleListJoinableDirectConvos);
      websocketeer.off("JOINED_DIRECT_CONVERSATION", handleJoinedDirectConversation);
    };
  }, [isOpen, dispatch]);

  const handleJoinDirectConversationClick = useCallback(() => {
    if (selectedUser === null) {
      return;
    }
    websocketeer.send("JOIN_DIRECT_CONVERSATION", { withUserId: selectedUser.userId });
  }, [selectedUser]);

  function handleCloseModal(): void {
    dispatch({ type: "SET_IS_JOIN_DIRECT_CONVERSATION_MODAL_OPEN", payload: false });
    onClose();
  }

  function handleCloseAlert(): void {
    setAlert({ type: null, icon: null, message: "", shown: false });
  }

  function handleSearchInput(e: ChangeEvent<HTMLInputElement>): void {
    setSearchText(e.target.value);
  }

  // prettier-ignore
  const handleUserClick = useCallback((user: PublicMember) => {
    setSelectedUser(user);
  }, []);

  // If we don't cache click handlers, rooms rerender a lot due to `onClick` being recreated.
  const userClickHandlers = useMemo(() => {
    return new Map(users?.map((user) => [user.userId, (): void => handleUserClick(user)]));
  }, [users, handleUserClick]);

  // prettier-ignore
  const renderInvitableUsers = useCallback(() => {
    console.log("rendering members")
    return users?.filter((user) => user.userName.includes(searchText)).map((user) => (
      <MemberMemo 
        key={user.userId} 
        isButton={true} 
        onClick={userClickHandlers.get(user.userId)} 
        memberName={user.userName} 
        memberId={user.userId} 
        isOnline={user.isActive} 
        className={selectedUser?.userId === user.userId ? "active" : ""} 
      />
    ));
  }, [searchText, users, selectedUser?.userId, userClickHandlers]);

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
                {renderInvitableUsers()}
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
