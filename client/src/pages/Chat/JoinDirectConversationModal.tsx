import React, { useEffect, useState } from "react";
import { Modal as BsModal } from "bootstrap";
import { Alert, Member, Modal, ModalBody, ModalContent, ModalDialog, ModalFooter, ModalHeader, ModalTitle } from "@components";
import websocketeer from "../../ws/instance";

interface JoinDirectConversationModalProperties {
  isOpen: boolean;
  onClose: () => void;
}

export default function JoinDirectConversationModal(props: JoinDirectConversationModalProperties): React.JSX.Element {
  const [alert, setAlert] = useState<AlertState>({ type: null, shown: false, icon: null });
  const [modalInstance, setModalInstance] = useState<InstanceType<typeof BsModal> | null>(null);
  const [users, setUsers] = useState<PublicAccount[] | null>(null);

  const { isOpen, onClose } = props;

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

  websocketeer.on("LIST_INVITABLE_USERS", ({ users, error }) => {
    if (error) {
      return console.error(error);
    }
    setUsers(users);
  });

  function handleGetModalInstance(modalInstance: BsModal | null): void {
    setModalInstance(modalInstance);
  }

  function handleCloseModal(): void {
    modalInstance?.hide();
    onClose();
  }

  function handleCloseAlert(): void {
    setAlert({ type: null, icon: null, message: "", shown: false });
  }

  return (
    <Modal getInstance={handleGetModalInstance} className="fade mh-100" tabIndex={-1} dataBsBackdrop="static" dataBsKeyboard={false}>
      <ModalDialog>
        <ModalContent>
          <ModalHeader>
            <ModalTitle as="h1" className="fs-5">
              New Direct Message
            </ModalTitle>
            <button className="btn-close" tabIndex={-1} type="button"></button>
          </ModalHeader>
          <ModalBody>
            <Alert isOpen={alert.shown} onClose={handleCloseAlert} icon={alert.icon} type={alert.type}>
              {alert.message}
            </Alert>
            <input className="form-control" placeholder="Search People" type="text" />
            <div className="border mt-3">
              <ul className="list-group" style={{ maxHeight: "35vh", overflowY: "scroll" }}>
                {users?.map((user) => <Member isButton={true} memberName={user.name} memberId={user.id} isOnline={user.isActive} />)}
              </ul>
            </div>
          </ModalBody>
          <ModalFooter>
            <button onClick={handleCloseModal} className="btn btn-danger" type="button">
              Close
            </button>
            <button className="btn btn-primary" type="button">
              Add
            </button>
          </ModalFooter>
        </ModalContent>
      </ModalDialog>
    </Modal>
  );
}

/*
#join-direct-convo-modal.modal.fade.modal.mh-100(tabindex="-1", data-bs-backdrop="static", data-bs-keyboard="false")
  .modal-dialog
    .modal-content
      .modal-header
        h1.modal-title.fs-5 New Direct Message
        button#close-modal-btn.btn-close(tabindex="-1", type="button", data-bs-dismiss="modal")
      .modal-body
        #join-direct-convo-alert.alert.d-none.d-flex.flex-row.align-items-center.justify-content-between.mh-100(role="alert")
          i(class="")
          #join-direct-convo-alert-message.mb-0.max-h-100px.overf-scroll
          button.btn-close(type="button", name="join-direct-convo-close-alert")
        input#join-direct-convo-modal-search-input.form-control(type="text", placeholder="Search People")
        .border.mt-3
          ul#join-direct-convo-modal-people-container.list-group(style="max-height: 35vh; overflow-y: scroll")
      .modal-footer
        button#cancel-join-direct-convo-btn.btn.btn-danger(type="button", data-bs-dismiss="modal") Close
        button#join-direct-convo-btn.btn.btn-primary(type="button") Add
        */
