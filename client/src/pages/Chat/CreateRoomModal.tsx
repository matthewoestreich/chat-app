import React, { useId, HTMLAttributes, useState, useRef, FormEvent, useEffect, useCallback } from "react";
import { Modal as BsModal } from "bootstrap";
import { Alert, Form, ButtonLoading, InputFloating, Modal, ModalBody, ModalContent, ModalDialog, ModalFooter, ModalHeader } from "@components";

interface CreateRoomModalProperties extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (room: CreateRoomResult) => void;
}

export default function CreateRoomModal(props: CreateRoomModalProperties): React.JSX.Element {
  const [alert, setAlert] = useState<AlertState>({ type: undefined, shown: false });
  const [isFormValidated, setIsFormValidated] = useState(false);
  const [isCloseButtonDisabled, setIsCloseButtonDisabled] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [modalInstance, setModalInstance] = useState<InstanceType<typeof BsModal> | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const checkboxId = useId();

  useEffect(() => {
    if (modalInstance) {
      if (props.isOpen === true) {
        modalInstance.show();
      } else if (props.isOpen === false) {
        modalInstance.hide();
      }
    }
  }, [props.isOpen, modalInstance]);

  function closeAlert(): void {
    setAlert({ type: undefined, shown: false, message: "", icon: "" });
  }

  function _handleGetFormRef(current: HTMLFormElement | null): void {
    formRef.current = current;
  }

  const handleGetFormRef = useCallback(
    (current: HTMLFormElement | null) => {
      formRef.current = current;
    },
    [formRef],
  );

  function handleClose(): void {
    props.onClose();
  }

  function _handleGetModalInstance(instance: BsModal | null): void {
    setModalInstance(instance);
  }
  const handleGetModalInstance = useCallback((instance: BsModal | null) => {
    setModalInstance(instance);
  }, []);

  function handleCreateRoom(): void {
    formRef.current?.requestSubmit();
  }

  async function handleSubmitForm(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    if (!formRef.current) {
      return;
    }

    // `.checkValidity()` comes from Bootstrap
    const isFormValid = event.currentTarget.checkValidity();
    formRef.current.setIsValid(isFormValid);
    setIsFormValidated(true);

    if (!isFormValid) {
      return;
    }

    setIsCreatingRoom(true);
    setIsCloseButtonDisabled(true);
    setIsCreatingRoom(true);
    //const result = await sendRegisterRequest(username, password, email);
    props.onCreate({ id: "", name: "" });
    props.onClose();
  }

  return (
    <Modal getInstance={handleGetModalInstance} className="fade modal-lg" dataBsBackdrop="static" dataBsKeyboard={false}>
      <ModalDialog>
        <ModalContent>
          <ModalHeader>
            <h1 className="modal-title fs-5">Create Room</h1>
            <button onClick={handleClose} className="btn btn-close" tabIndex={-1} type="button"></button>
          </ModalHeader>
          <ModalBody>
            <Alert
              isOpen={alert.shown}
              icon={alert.icon}
              type={alert.type}
              onClose={closeAlert}
              rootClassName="d-flex flex-row align-items-center justify-content-between mh-100"
              messageClassName="mb-0 max-h-100px overf-scroll"
            >
              {alert.message}
            </Alert>
            <div className="form-group">
              <Form getRef={handleGetFormRef} onSubmit={handleSubmitForm} validated={isFormValidated}>
                <InputFloating type="text" invalidMessage="Room name is required!" placeholder="Room Name" required>
                  Room Name
                </InputFloating>
                <div className="form-check mt-1">
                  <input id={checkboxId} className="form-check-input" type="checkbox" value="" />
                  <label className="form-check-label" htmlFor={checkboxId}>
                    Private?
                  </label>
                </div>
              </Form>
            </div>
          </ModalBody>
          <ModalFooter>
            <button onClick={handleClose} className="btn btn-danger" type="button" disabled={isCloseButtonDisabled}>
              Close
            </button>
            <ButtonLoading onClick={handleCreateRoom} isLoading={isCreatingRoom} className="btn btn-primary" type="submit">
              Create Room
            </ButtonLoading>
          </ModalFooter>
        </ModalContent>
      </ModalDialog>
    </Modal>
  );
}
