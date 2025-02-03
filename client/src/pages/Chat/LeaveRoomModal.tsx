import React, { HTMLAttributes, useEffect, useState } from "react";
import { Modal as BsModal } from "bootstrap";
import { Modal, ModalDialog, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@components";

interface LeaveRoomModalProperties extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onLeave: (leaveRoomResult: boolean) => void;
  onClose: () => void;
}

// LeaveRoomModal
export default function LeaveRoomModal(props: LeaveRoomModalProperties): React.JSX.Element {
  const [modalInstance, setModalInstance] = useState<InstanceType<typeof BsModal> | null>(null);

  useEffect(() => {
    if (modalInstance) {
      if (props.isOpen === true) {
        modalInstance.show();
      } else if (props.isOpen === false) {
        modalInstance.hide();
      }
    }
  }, [props.isOpen, modalInstance]);

  function handleGetModalInstance(modal: BsModal | null): void {
    setModalInstance(modal);
  }

  function handleModalClose(): void {
    props.onClose();
  }

  function handleOnLeave(): void {
    props.onLeave(true);
  }

  return (
    <Modal getInstance={handleGetModalInstance} size="sm" className="fade" dataBsBackdrop="static" dataBsKeyboard={false}>
      <ModalDialog>
        <ModalContent>
          <ModalHeader>
            <h1 className="modal-title fs-5">Confirmation</h1>
            <button onClick={handleModalClose} className="btn-close" type="button"></button>
          </ModalHeader>
          <ModalBody id="leave-room-confirmation-modal-body">Are you sure you want to leave?</ModalBody>
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
