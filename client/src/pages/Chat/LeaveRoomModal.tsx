import React, { HTMLAttributes } from "react";
import { Modal, ModalDialog, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@components";
import { websocketeer } from "@src/ws";
import { useChat } from "@hooks";

interface LeaveRoomModalProperties extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
}

// LeaveRoomModal
export default function LeaveRoomModal(props: LeaveRoomModalProperties): React.JSX.Element {
  const { state } = useChat();

  websocketeer.on("UNJOINED_ROOM", ({ error }) => {
    if (error) {
      return console.error(error);
    }
    handleModalClose();
  });

  function handleModalClose(): void {
    props.onClose();
  }

  function handleOnLeave(): void {
    if (state.chatScope && state.chatScope.type === "Room") {
      websocketeer.send("UNJOIN_ROOM", { id: state.chatScope.id });
    }
  }

  return (
    <Modal shown={props.isOpen} size="sm" className="fade" dataBsBackdrop="static" dataBsKeyboard={false}>
      <ModalDialog>
        <ModalContent>
          <ModalHeader>
            <h1 className="modal-title fs-5">Confirmation</h1>
            <button onClick={handleModalClose} className="btn-close" type="button"></button>
          </ModalHeader>
          <ModalBody>Are you sure you want to leave?</ModalBody>
          <ModalFooter>
            <button onClick={handleModalClose} className="btn btn-secondary" type="button">
              Close
            </button>
            <button onClick={handleOnLeave} className="btn btn-danger" type="button">
              Leave Room
            </button>
          </ModalFooter>
        </ModalContent>
      </ModalDialog>
    </Modal>
  );
}
