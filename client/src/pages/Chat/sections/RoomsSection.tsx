import React, { useCallback, useMemo, useRef, memo } from "react";
import { Room } from "@components";
import { useAuth, useChat, useEffectOnce } from "@hooks";
import { websocketeer, WebSocketEvents } from "@client/src/ws";
import closeOffcanvasAtOrBelowBreakpoint from "@client/src/closeOffcanvasAtOrBelowBreakpoint";
import { WebSocketeerEventHandler } from "../../../../types";
import sortMembers from "../sortMembers";
import { ChatScope } from "@root/types.shared";

const RoomMemo = memo(Room);

export default function RoomsSection(): React.JSX.Element {
  const { user } = useAuth();
  const { state, dispatch } = useChat();
  const offcanvasRoomsRef = useRef<HTMLDivElement | null>(null);

  useEffectOnce(() => {
    const handleEnteredRoom: WebSocketeerEventHandler<WebSocketEvents, "ENTERED_ROOM"> = ({ members, messages, room, error }) => {
      if (error) {
        return console.error(error);
      }
      sortMembers(members, false);
      const scope: ChatScope = { type: "Room", userId: user!.id, id: room.id, userName: user!.userName, scopeName: room.name };
      dispatch({ type: "ENTERED_ROOM", payload: { members, messages, chatScope: scope } });
    };

    const handleCreatedRoom: WebSocketeerEventHandler<WebSocketEvents, "CREATED_ROOM"> = ({ rooms, error }) => {
      if (error) {
        return console.error(error);
      }
      dispatch({ type: "SET_ROOMS", payload: rooms });
    };

    const handleListRooms: WebSocketeerEventHandler<WebSocketEvents, "LIST_ROOMS"> = ({ rooms, error }) => {
      if (error) {
        return console.error(error);
      }
      dispatch({ type: "SET_ROOMS", payload: rooms });
    };

    const handleJoinedRoom: WebSocketeerEventHandler<WebSocketEvents, "JOINED_ROOM"> = ({ rooms, error }) => {
      if (error) {
        return console.error(error);
      }
      dispatch({ type: "SET_ROOMS", payload: rooms });
    };

    const handleUnjoinedRoom: WebSocketeerEventHandler<WebSocketEvents, "UNJOINED_ROOM"> = ({ rooms, error }) => {
      if (error) {
        return console.error(error);
      }
      dispatch({ type: "AFTER_UNJOINED_ROOM", payload: rooms });
    };

    websocketeer.on("ENTERED_ROOM", handleEnteredRoom);
    websocketeer.on("CREATED_ROOM", handleCreatedRoom);
    websocketeer.on("LIST_ROOMS", handleListRooms);
    websocketeer.on("JOINED_ROOM", handleJoinedRoom);
    websocketeer.on("UNJOINED_ROOM", handleUnjoinedRoom);

    return (): void => {
      websocketeer.off("ENTERED_ROOM", handleEnteredRoom);
      websocketeer.off("CREATED_ROOM", handleCreatedRoom);
      websocketeer.off("LIST_ROOMS", handleListRooms);
      websocketeer.off("JOINED_ROOM", handleJoinedRoom);
      websocketeer.off("UNJOINED_ROOM", handleUnjoinedRoom);
    };
  });

  function handleOpenJoinRoomModal(): void {
    dispatch({ type: "SET_IS_JOIN_ROOM_MODAL_SHOWN", payload: true });
  }

  function handleOpenLeaveRoomModal(): void {
    dispatch({ type: "SET_IS_LEAVE_ROOM_MODAL_SHOWN", payload: true });
  }

  function handleOpenCreateRoomModal(): void {
    dispatch({ type: "SET_IS_CREATE_ROOM_MODAL_SHOWN", payload: true });
  }
  /**
   * Room click handler
   */
  // prettier-ignore
  const handleRoomClick = useCallback((roomId: string) => {
    if (state.chatScope?.id === roomId) {
      // We're already in this room
      return;
    }
    // No need to update ChatScope here. We only want to do that AFTER we entered the room.
    dispatch({ type: "SET_IS_ENTERING_ROOM", payload: true });
    websocketeer.send("ENTER_ROOM", { id: roomId });
    closeOffcanvasAtOrBelowBreakpoint(offcanvasRoomsRef, "md");
  }, [dispatch, state.chatScope?.id]);

  /**
   * Room click handlers map
   * If we don't cache click handlers, rooms rerender a lot due to `onClick` being recreated.
   */
  const roomClickHandlers = useMemo(() => {
    return new Map(state.rooms?.map((room) => [room.id, (): void => handleRoomClick(room.id)]));
  }, [state.rooms, handleRoomClick]);

  /**
   * Rooms render function
   */
  const renderRooms = useCallback(() => {
    console.log("[ChatView] in 'renderRooms' (this does not mean rooms ae rendering)");
    return state.rooms?.map((room) => (
      <RoomMemo
        key={room.id}
        roomId={room.id}
        roomName={room.name}
        onClick={roomClickHandlers.get(room.id)}
        isSelected={state.chatScope?.id === room.id}
      />
    ));
  }, [state.rooms, state.chatScope?.id, roomClickHandlers]);

  return (
    <div
      ref={offcanvasRoomsRef}
      id="rooms-offcanvas"
      className="card col-xl-3 col-xxl-2 col-3 d-lg-flex flex-column h-lg-90pct min-h-0 overf-hide offcanvas-lg offcanvas-end"
    >
      <div className="card-header d-flex flex-row display-6 text-center">
        <div className="flex-fill text-center">Rooms</div>
        <button
          className="btn btn-close btn-sm d-lg-none ms-auto shadow"
          type="button"
          data-bs-dismiss="offcanvas"
          data-bs-target="#rooms-offcanvas"
        ></button>
      </div>
      <ul id="rooms-container" className="card-body overf-y-scroll p-0 m-1">
        {renderRooms()}
      </ul>
      <div className="card-footer">
        <div className="row">
          <div className="col-4 d-flex p-1">
            <button
              onClick={handleOpenJoinRoomModal}
              id="open-join-room-modal"
              className="btn btn-primary shadow flex-grow-1"
              type="button"
              title="Join Room"
            >
              <i className="bi bi-box-arrow-in-up-right"></i>
            </button>
          </div>
          <div className="col-4 d-flex p-1">
            <button
              onClick={handleOpenLeaveRoomModal}
              id="open-leave-room-modal"
              className="btn btn-warning shadow flex-grow-1"
              type="button"
              title="Leave Current Room"
              disabled={state.chatScope === null}
            >
              <i className="bi bi-box-arrow-down-left"></i>
            </button>
          </div>
          <div className="col-4 d-flex p-1">
            <button onClick={handleOpenCreateRoomModal} className="btn btn-primary shadow flex-grow-1" type="button" title="Create Room">
              <i className="bi bi-folder-plus"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
