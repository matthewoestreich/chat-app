import React, { ChangeEvent, HTMLAttributes, memo, useCallback, useEffect, useMemo, useState } from "react";
import { Modal as BsModal } from "bootstrap";
import { WebSocketeer, WebSocketEvents } from "@client/ws";
import { Alert, ButtonLoading, JoinableRoom, Modal, ModalBody, ModalContent, ModalDialog, ModalFooter, ModalHeader } from "@components";

const ModalMemo = memo(Modal);
const ModalBodyMemo = memo(ModalBody);
const ModalContentMemo = memo(ModalContent);
const ModalDialogMemo = memo(ModalDialog);
const ModalFooterMemo = memo(ModalFooter);
const ModalHeaderMemo = memo(ModalHeader);
const JoinableRoomMemo = memo(JoinableRoom);
const ButtonLoadingMemo = memo(ButtonLoading);

interface JoinRoomModalProperties extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  websocketeer: WebSocketeer<WebSocketEvents>;
}

export default function JoinRoomModal(props: JoinRoomModalProperties): React.JSX.Element {
  const [selectedRoom, setSelectedRoom] = useState<IRoom | null>(null);
  const [searchText, setSearchText] = useState("");
  const [alert, setAlert] = useState<AlertState>({ type: undefined, shown: false });
  const [modalInstance, setModalInstance] = useState<InstanceType<typeof BsModal> | null>(null);
  const [rooms, setRooms] = useState<IRoom[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (modalInstance) {
      if (props.isOpen === true) {
        modalInstance.show();
        props.websocketeer.send("GET_JOINABLE_ROOMS");
      } else if (props.isOpen === false) {
        modalInstance.hide();
      }
    }
  }, [props.isOpen, props.websocketeer, modalInstance]);

  props.websocketeer.on("LIST_JOINABLE_ROOMS", ({ rooms }) => {
    setRooms(rooms);
  });

  props.websocketeer.on("JOINED_ROOM", () => {
    if (selectedRoom) {
      setRooms(rooms?.filter((room) => room.id !== selectedRoom.id));
    }
    setIsLoading(false);
    setSelectedRoom(null);
  });

  function handleCloseAlert(): void {
    setAlert({ type: undefined, shown: false, icon: "", message: "" });
  }

  function handleCloseModal(): void {
    props.onClose();
  }

  function handleJoinRoom(): void {
    if (selectedRoom === null) {
      return;
    }
    setIsLoading(true);
    props.websocketeer.send("JOIN_ROOM", { id: selectedRoom.id });
  }

  const renderRooms = useCallback(() => {
    return rooms
      ?.filter((room) => room.name.includes(searchText))
      .map((room) => (
        <JoinableRoomMemo key={room.id} onClick={() => setSelectedRoom(room)} isSelected={selectedRoom === room} roomId={room.id} name={room.name} />
      ));
  }, [searchText, rooms, selectedRoom]);

  function handleGetModalInstance(modalInstance: BsModal | null): void {
    setModalInstance(modalInstance);
  }

  function handleSearchInput(e: ChangeEvent<HTMLInputElement>): void {
    setSearchText(e.target.value);
  }

  return (
    <ModalMemo getInstance={handleGetModalInstance} className="fade" dataBsBackdrop="static" dataBsKeyboard={false}>
      <ModalDialogMemo>
        <ModalContentMemo>
          <ModalHeaderMemo>
            <h1 className="modal-title fs-5">Join Room</h1>
            <button onClick={handleCloseModal} className="btn btn-close" tabIndex={-1} type="button"></button>
          </ModalHeaderMemo>
          <ModalBodyMemo>
            <Alert
              isOpen={alert.shown}
              icon={alert.icon}
              type={alert.type}
              onClose={handleCloseAlert}
              rootClassName="d-flex flex-row align-items-center justify-content-between mh-100"
              messageClassName="mb-0 max-h-100px overf-scroll"
            >
              {alert.message}
            </Alert>
            <input onChange={handleSearchInput} value={searchText} className="form-control" type="text" placeholder="Search Rooms" />
            <div className="border mt-3">
              <ul className="list-group" style={{ maxHeight: "35vh", overflowY: "scroll" }}>
                {useMemo(() => renderRooms(), [renderRooms])}
              </ul>
            </div>
          </ModalBodyMemo>
          <ModalFooterMemo>
            <button onClick={handleCloseModal} className="btn btn-danger" type="button">
              Close
            </button>
            <ButtonLoadingMemo onClick={handleJoinRoom} isLoading={isLoading} className="btn btn-primary" type="button">
              Join Room
            </ButtonLoadingMemo>
          </ModalFooterMemo>
        </ModalContentMemo>
      </ModalDialogMemo>
    </ModalMemo>
  );
}
