import React, { ChangeEvent, memo, useCallback, useEffect, useMemo, useState } from "react";
import { Modal as BsModal } from "bootstrap";
import { Alert, Member, Modal, ModalBody, ModalContent, ModalDialog, ModalFooter, ModalHeader, ModalTitle } from "@components";
import { SingletonWebSocketeer as websocketeer, WebSocketEvents } from "@src/ws";
import sortMembers from "./sortMembers";
import { PublicMember } from "@root/types.shared";
import { AlertState, WebSocketeerEventPayload } from "@client/types";
import { useChat, useEffectOnce } from "@hooks";
import { JoinedDirectConvoPayload } from "./DirectMessagesDrawer";

interface JoinDirectConversationModalProperties {
  isOpen: boolean;
  onClose: () => void;
}

const MemberMemo = memo(Member);

export default function JoinDirectConversationModal(props: JoinDirectConversationModalProperties): React.JSX.Element {
  const { dispatch } = useChat();
  const [alert, setAlert] = useState<AlertState>({ type: null, shown: false, icon: null });
  const [modalInstance, setModalInstance] = useState<InstanceType<typeof BsModal> | null>(null);
  const [users, setUsers] = useState<PublicMember[] | null>(null);
  const [selectedUser, setSelectedUser] = useState<PublicMember | null>(null);
  const [searchText, setSearchText] = useState("");

  const { isOpen, onClose } = props;

  useEffectOnce(() => {
    const handleListInvitableUsers: (payload: WebSocketeerEventPayload<WebSocketEvents, "LIST_INVITABLE_USERS">) => void = ({ users, error }) => {
      console.log("list invit users");
      if (error) {
        return console.error(error);
      }
      setUsers((_prev) => sortMembers(users, true));
    };

    const handleJoinedDirectConversation: JoinedDirectConvoPayload = ({ directConversationId }) => {
      console.log({ directConversationId, users });
      websocketeer.send("GET_INVITABLE_USERS");
    };

    websocketeer.on("LIST_INVITABLE_USERS", handleListInvitableUsers);
    websocketeer.on("JOINED_DIRECT_CONVERSATION", handleJoinedDirectConversation);

    return (): void => {
      console.log("cleanup in joindirectconvomodal");
      websocketeer.off("LIST_INVITABLE_USERS", handleListInvitableUsers);
      websocketeer.off("JOINED_DIRECT_CONVERSATION", handleJoinedDirectConversation);
    };
  });

  useEffect(() => {
    if (modalInstance) {
      if (isOpen === true) {
        modalInstance.show();
        websocketeer.send("GET_INVITABLE_USERS");
      } else if (isOpen === false) {
        modalInstance.hide();
      }
    }
  }, [isOpen, modalInstance]);

  useEffect(() => {
    console.log("DONT FORGET TO REMOE THIHS");
    console.log(`users changed:`, users);
  }, [users]);

  function handleGetModalInstance(modalInstance: BsModal | null): void {
    setModalInstance(modalInstance);
  }

  const handleJoinDirectConversationClick = useCallback(() => {
    if (selectedUser === null) {
      return;
    }
    console.log({ selectedUser });
    websocketeer.send("JOIN_DIRECT_CONVERSATION", { withUserId: selectedUser.userId });
  }, [selectedUser]);

  function handleCloseModal(): void {
    dispatch({ type: "SET_IS_JOIN_DIRECT_CONVERSATION_MODAL_OPEN", payload: false });
    modalInstance?.hide();
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
    console.log(`[renderInvitUsers] one of |users|searchtext|selectedUser?.userId|userClickHandlers| changed`, users)
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
    <Modal getInstance={handleGetModalInstance} className="fade mh-100" tabIndex={-1} dataBsBackdrop="static" dataBsKeyboard={false}>
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
