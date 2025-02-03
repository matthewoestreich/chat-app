import React, { ChangeEvent, HTMLAttributes, useCallback, useEffect, useState } from "react";
import { Modal as BsModal } from "bootstrap";
import { WebSocketeer, WebSocketEvents } from "@client/ws";
import { Alert, ButtonLoading, JoinableRoom, Modal, ModalBody, ModalContent, ModalDialog, ModalFooter, ModalHeader } from "@components";

interface JoinRoomModalProperties extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  websocketeer: WebSocketeer<WebSocketEvents>;
}

export default function JoinRoomModal(props: JoinRoomModalProperties): React.JSX.Element {
  const { isOpen, websocketeer, onClose } = props;

  const [selectedRoom, setSelectedRoom] = useState<IRoom | null>(null);
  const [searchText, setSearchText] = useState("");
  const [alert, setAlert] = useState<AlertState>({ type: undefined, shown: false });
  const [modalInstance, setModalInstance] = useState<InstanceType<typeof BsModal> | null>(null);
  const [rooms, setRooms] = useState<IRoom[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (modalInstance) {
      if (isOpen === true) {
        modalInstance.show();
        websocketeer.send("GET_JOINABLE_ROOMS");
      } else if (isOpen === false) {
        modalInstance.hide();
      }
    }
  }, [isOpen, websocketeer, modalInstance]);

  websocketeer.on("LIST_JOINABLE_ROOMS", ({ rooms }) => {
    if (!isOpen) {
      return;
    }
    setRooms(rooms);
  });

  websocketeer.on("JOINED_ROOM", () => {
    if (!isOpen) {
      return;
    }
    if (selectedRoom) {
      setRooms((prevRooms) => prevRooms?.filter((room) => room.id !== selectedRoom.id));
    }
    setIsLoading(false);
    setSelectedRoom(null);
  });

  function handleCloseAlert(): void {
    setAlert({ type: undefined, shown: false, icon: "", message: "" });
  }

  function handleCloseModal(): void {
    onClose();
  }

  function handleJoinRoom(): void {
    if (selectedRoom === null) {
      return;
    }
    setIsLoading(true);
    websocketeer.send("JOIN_ROOM", { id: selectedRoom.id });
  }

  const renderRooms = useCallback(() => {
    return rooms
      ?.filter((room) => room.name.includes(searchText))
      .map((room) => (
        <JoinableRoom key={room.id} onClick={() => setSelectedRoom(room)} isSelected={selectedRoom === room} roomId={room.id} name={room.name} />
      ));
  }, [searchText, rooms, selectedRoom]);

  function handleGetModalInstance(modalInstance: BsModal | null): void {
    setModalInstance(modalInstance);
  }

  function handleSearchInput(e: ChangeEvent<HTMLInputElement>): void {
    setSearchText(e.target.value);
  }

  return (
    <Modal getInstance={handleGetModalInstance} className="fade" dataBsBackdrop="static" dataBsKeyboard={false}>
      <ModalDialog>
        <ModalContent>
          <ModalHeader>
            <h1 className="modal-title fs-5">Join Room</h1>
            <button onClick={handleCloseModal} className="btn btn-close" tabIndex={-1} type="button"></button>
          </ModalHeader>
          <ModalBody>
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
                {renderRooms()}
              </ul>
            </div>
          </ModalBody>
          <ModalFooter>
            <button onClick={handleCloseModal} className="btn btn-danger" type="button">
              Close
            </button>
            <ButtonLoading onClick={handleJoinRoom} isLoading={isLoading} className="btn btn-primary" type="button">
              Join Room
            </ButtonLoading>
          </ModalFooter>
        </ModalContent>
      </ModalDialog>
    </Modal>
  );
}
