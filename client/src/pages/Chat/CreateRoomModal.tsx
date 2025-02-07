import React, { useId, HTMLAttributes, useState, useRef, FormEvent, useEffect, useCallback, ChangeEvent } from "react";
import { Modal as BsModal } from "bootstrap";
import { Alert, Form, ButtonLoading, InputFloating, Modal, ModalBody, ModalContent, ModalDialog, ModalFooter, ModalHeader } from "@components";
import { SingletonWebSocketeer as websocketeer, WebSocketEvents } from "@src/ws";
import { AlertState, WebSocketeerEventPayload } from "../../../types";
import { useEffectOnce } from "@hooks";

interface CreateRoomModalProperties extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateRoomModal(props: CreateRoomModalProperties): React.JSX.Element {
  const checkboxId = useId();
  const [alert, setAlert] = useState<AlertState>({ type: null, shown: false, icon: null });
  const [isFormValidated, setIsFormValidated] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [modalInstance, setModalInstance] = useState<InstanceType<typeof BsModal> | null>(null);
  const [roomNameInput, setRoomNameInput] = useState("");
  const [isPrivateCheckboxChecked, setIsPrivateCheckboxChecked] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  const { isOpen, onClose } = props;

  useEffect(() => {
    if (modalInstance) {
      if (isOpen === true) {
        modalInstance.show();
      } else if (isOpen === false) {
        modalInstance.hide();
      }
    }
  }, [isOpen, modalInstance]);

  useEffectOnce(() => {
    const handleOnCreatedRoom: (payload: WebSocketeerEventPayload<WebSocketEvents, "CREATED_ROOM">) => void = ({ error }) => {
      if (error) {
        return console.error(error);
      }
      if (!isOpen) {
        return;
      }
      setAlert({ type: "success", shown: true, message: `Successfully created room!`, icon: "bi-check" });
      setIsCreatingRoom(false);
    };

    websocketeer.on("CREATED_ROOM", handleOnCreatedRoom);

    return (): void => {
      websocketeer.off("CREATED_ROOM", handleOnCreatedRoom);
    };
  });

  function closeAlert(): void {
    setAlert({ type: null, shown: false, message: "", icon: "" });
  }

  // prettier-ignore
  const handleGetFormRef = useCallback((current: HTMLFormElement | null) => {
    formRef.current = current;
  }, [formRef]);

  function handleRoomNameInput(e: ChangeEvent<HTMLInputElement>): void {
    setRoomNameInput(e.target.value);
  }

  function handleIsPrivateCheckboxChange(e: ChangeEvent<HTMLInputElement>): void {
    setIsPrivateCheckboxChecked(e.target.checked);
  }

  function handleClose(): void {
    closeAlert();
    setRoomNameInput("");
    setIsPrivateCheckboxChecked(false);
    setIsCreatingRoom(false);
    onClose();
  }

  const handleGetModalInstance = useCallback((instance: BsModal | null) => {
    setModalInstance(instance);
  }, []);

  function handleCreateRoom(): void {
    formRef.current?.requestSubmit();
  }

  function handleSubmitForm(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    event.stopPropagation();
    if (!formRef.current) {
      return;
    }
    // checkValidity() comes from Bootstrap
    const isFormValid = event.currentTarget.checkValidity();
    setIsFormValidated(true);
    if (!isFormValid) {
      return;
    }
    setIsCreatingRoom(true);
    websocketeer.send("CREATE_ROOM", { name: roomNameInput, isPrivate: isPrivateCheckboxChecked });
  }

  return (
    <Modal getInstance={handleGetModalInstance} size="md" className="fade" dataBsBackdrop="static" dataBsKeyboard={false}>
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
                <InputFloating
                  onChange={handleRoomNameInput}
                  value={roomNameInput}
                  type="text"
                  invalidMessage="Room name is required!"
                  placeholder="Room Name"
                  required
                >
                  Room Name
                </InputFloating>
                <div className="form-check mt-1">
                  <input
                    id={checkboxId}
                    onChange={handleIsPrivateCheckboxChange}
                    checked={isPrivateCheckboxChecked}
                    className="form-check-input"
                    type="checkbox"
                    value=""
                  />
                  <label className="form-check-label" htmlFor={checkboxId}>
                    Private?
                  </label>
                </div>
              </Form>
            </div>
          </ModalBody>
          <ModalFooter>
            <button onClick={handleClose} className="btn btn-danger" type="button" disabled={isCreatingRoom}>
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
