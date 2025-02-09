import React, { HTMLAttributes, useCallback, useEffect } from "react";
import { Modal, ModalDialog, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@components";
import { websocketeer, WebSocketEvents } from "@src/ws";
import { useChat } from "@hooks";
import { WebSocketeerEventHandler } from "../../../types";

interface LeaveDirectConversationModalProperties extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
}

export default function LeaveDirectConversationModal(props: LeaveDirectConversationModalProperties): React.JSX.Element {
  const { isOpen, onClose } = props;
  const { state, dispatch } = useChat();

  const handleModalClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleLeftDirectConvo: WebSocketeerEventHandler<WebSocketEvents, "LEFT_DIRECT_CONVERSATION"> = ({ error, directConversations }) => {
      if (error) {
        return console.error(error);
      }
      dispatch({ type: "LEFT_DIRECT_CONVERSATION", payload: directConversations });
      handleModalClose();
    };

    websocketeer.on("LEFT_DIRECT_CONVERSATION", handleLeftDirectConvo);

    return (): void => {
      websocketeer.off("LEFT_DIRECT_CONVERSATION", handleLeftDirectConvo);
    };
  }, [isOpen, dispatch, handleModalClose]);

  function handleOnLeave(): void {
    console.log(state.chatScope);
    if (state.chatScope && state.chatScope.type === "DirectConversation") {
      websocketeer.send("LEAVE_DIRECT_CONVERSATION", { id: state.chatScope.id });
    }
  }

  return (
    <Modal shown={props.isOpen} size="md" className="fade" dataBsBackdrop="static" dataBsKeyboard={false}>
      <ModalDialog>
        <ModalContent>
          <ModalHeader>
            <h1 className="modal-title fs-5">Confirmation</h1>
            <button onClick={handleModalClose} className="btn-close" type="button"></button>
          </ModalHeader>
          <ModalBody>Are you sure you want to leave conversation{state.chatScope === null ? "?" : ` with ${state.chatScope.scopeName}?`}</ModalBody>
          <ModalFooter>
            <button onClick={handleModalClose} className="btn btn-secondary" type="button">
              Close
            </button>
            <button onClick={handleOnLeave} className="btn btn-danger" type="button">
              Leave Direct Message
            </button>
          </ModalFooter>
        </ModalContent>
      </ModalDialog>
    </Modal>
  );
}
