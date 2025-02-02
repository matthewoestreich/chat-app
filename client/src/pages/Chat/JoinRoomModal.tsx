import React, { ChangeEvent, HTMLAttributes, useEffect, useState } from "react";
import { Modal as BsModal } from "bootstrap";
// prettier-ignore
import { 
  Alert, 
  ButtonLoading, 
  JoinableRoom, 
  Modal,
  ModalBody, 
  ModalContent, 
  ModalDialog, 
  ModalFooter, 
  ModalHeader 
} from "@components";

interface JoinRoomModalProperties extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (room: IRoom) => void;
  rooms: IRoom[] | null;
  isLoading: boolean;
}

export default function JoinRoomModal(props: JoinRoomModalProperties): React.JSX.Element {
  //const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<IRoom | null>(null);
  const [searchText, setSearchText] = useState("");
  const [alert, setAlert] = useState<AlertState>({ type: undefined, shown: false });
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

  const filteredRooms = props.rooms?.filter((room) => room.name.includes(searchText));

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
    props.onJoin(selectedRoom);
  }

  function handleRoomClick(room: IRoom): () => void {
    return () => setSelectedRoom(room);
  }

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
                {filteredRooms?.map((room) => (
                  <JoinableRoom key={room.id} onClick={handleRoomClick(room)} isSelected={selectedRoom === room} roomId={room.id} name={room.name} />
                ))}
              </ul>
            </div>
          </ModalBody>
          <ModalFooter>
            <button onClick={handleCloseModal} className="btn btn-danger" type="button">
              Close
            </button>
            <ButtonLoading onClick={handleJoinRoom} isLoading={props.isLoading} className="btn btn-primary" type="button">
              Join Room
            </ButtonLoading>
          </ModalFooter>
        </ModalContent>
      </ModalDialog>
    </Modal>
  );
}
