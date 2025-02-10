import React, { ChangeEvent, HTMLAttributes, memo, useCallback, useEffect, useMemo, useState } from "react";
import { Alert, ButtonLoading, JoinableRoom, Modal, ModalBody, ModalContent, ModalDialog, ModalFooter, ModalHeader } from "@components";
import { websocketeer, WebSocketEvents } from "@src/ws";
import { Room } from "@root/types.shared";
import { AlertState, WebSocketeerEventHandler } from "@client/types";

const JoinableRoomMemo = memo(JoinableRoom);

interface JoinRoomModalProperties extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
}

export default function JoinRoomModal(props: JoinRoomModalProperties): React.JSX.Element {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [alert, setAlert] = useState<AlertState>({ type: null, shown: false, icon: null });
  const [rooms, setRooms] = useState<Room[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [searchText, setSearchText] = useState("");

  const { isOpen, onClose } = props;

  useEffect(() => {
    const handleListJoinableRooms: WebSocketeerEventHandler<WebSocketEvents, "LIST_JOINABLE_ROOMS"> = ({ rooms, error }) => {
      if (error) {
        return console.error(error);
      }
      if (!isOpen) {
        return;
      }
      setRooms(rooms);
      setIsLoading(false);
    };

    if (isOpen === true) {
      websocketeer.send("GET_JOINABLE_ROOMS");
      websocketeer.on("LIST_JOINABLE_ROOMS", handleListJoinableRooms);
    }

    return (): void => {
      websocketeer.off("LIST_JOINABLE_ROOMS", handleListJoinableRooms);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleOnJoinedRoom: WebSocketeerEventHandler<WebSocketEvents, "JOINED_ROOM"> = ({ error }) => {
      if (error) {
        return console.error(error);
      }

      if (selectedRoom) {
        setAlert({ type: "success", icon: "bi-check", shown: true, message: `Successfully joined room "${selectedRoom.name}"!` });
        setRooms(rooms?.filter((room) => room.id !== selectedRoom.id) || []);
      }
      setIsJoiningRoom(false);
      setSelectedRoom(null);
    };

    websocketeer.on("JOINED_ROOM", handleOnJoinedRoom);

    return (): void => {
      websocketeer.off("JOINED_ROOM", handleOnJoinedRoom);
    };
  }, [rooms, selectedRoom]);

  function handleCloseAlert(): void {
    setAlert({ type: null, shown: false, icon: null, message: "" });
  }

  function handleCloseModal(): void {
    setAlert({ type: null, icon: null, shown: false, message: "" });
    setSearchText("");
    setIsLoading(false);
    setRooms(null);
    onClose();
  }

  function handleJoinRoom(): void {
    if (selectedRoom === null) {
      return;
    }
    setIsJoiningRoom(true);
    websocketeer.send("JOIN_ROOM", { id: selectedRoom.id });
  }

  const handleRoomClick = useCallback((room: Room) => {
    setSelectedRoom(room);
  }, []);

  const roomClickHandlers = useMemo(() => {
    return new Map(rooms?.map((room) => [room.id, (): void => handleRoomClick(room)]));
  }, [rooms, handleRoomClick]);

  const renderRooms = useCallback(() => {
    if (!rooms || isLoading) {
      return <div>Loading..</div>;
    }
    return rooms.map((room) => (
      <JoinableRoomMemo key={room.id} onClick={roomClickHandlers.get(room.id)} isSelected={selectedRoom === room} roomId={room.id} name={room.name} />
    ));
  }, [rooms, isLoading, roomClickHandlers, selectedRoom]);

  function handleSearchInput(e: ChangeEvent<HTMLInputElement>): void {
    setSearchText(e.target.value);
  }

  return (
    <Modal shown={props.isOpen} className="fade" dataBsBackdrop="static" dataBsKeyboard={false}>
      <ModalDialog>
        <ModalContent>
          <ModalHeader>
            <h1 className="modal-title fs-5">Join Room</h1>
            <button onClick={handleCloseModal} className="btn btn-close" tabIndex={-1} type="button"></button>
          </ModalHeader>
          <ModalBody>
            <Alert isOpen={alert.shown} icon={alert.icon} type={alert.type} onClose={handleCloseAlert}>
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
            <ButtonLoading onClick={handleJoinRoom} isLoading={isJoiningRoom} className="btn btn-primary" type="button">
              Join Room
            </ButtonLoading>
          </ModalFooter>
        </ModalContent>
      </ModalDialog>
    </Modal>
  );
}
