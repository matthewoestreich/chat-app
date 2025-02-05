import React, { ChangeEvent, KeyboardEvent, memo, useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Message, Room, Member, LoadingSpinner } from "@components";
import { useAuth, useRenderCounter } from "@hooks";
import { SingletonWebSocketeer as websocketeer } from "@client/ws";
import Topbar from "../Topbar";
import LeaveRoomModal from "./LeaveRoomModal";
import JoinRoomModal from "./JoinRoomModal";
import CreateRoomModal from "./CreateRoomModal";
import DirectMessagesDrawer from "./DirectMessagesDrawer";
import chatReducer from "./chatReducer";

const RoomMemo = memo(Room);
const MessageMemo = memo(Message);
const MemberMemo = memo(Member);
const LeaveRoomModalMemo = memo(LeaveRoomModal);
const JoinRoomModalMemo = memo(JoinRoomModal);
const CreateRoomModalMemo = memo(CreateRoomModal);
const DirectMessagesDrawerMemo = memo(DirectMessagesDrawer);
const LoadingSpinnerMemo = memo(LoadingSpinner);
const TopbarMemo = memo(Topbar);

interface ChatViewProperties {
  rooms: IRoom[] | null;
}

export default function ChatView(props: ChatViewProperties): React.JSX.Element {
  const renderCount = useRenderCounter(`ChatPage`);
  console.log(renderCount);

  const [isLeaveRoomModalShown, setIsLeaveRoomModalShown] = useState(false);
  const [isCreateRoomModalShown, setIsCreateRoomModalShown] = useState(false);
  const [isJoinRoomModalShown, setIsJoinRoomModalShown] = useState(false);
  const [isDirectMessagesShown, setIsDirectMessagesShown] = useState(false);
  const chatDisplayRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const [state, dispatch] = useReducer(chatReducer, {
    rooms: props.rooms,
    members: null,
    messages: null,
    chatScope: null,
    messageText: "",
    isEnteringRoom: false,
  });

  // Scroll to bottom of chat display when we send/receive a message
  useEffect(() => {
    if (chatDisplayRef.current && state.messages && state.messages.length > 0) {
      chatDisplayRef.current.scrollTop = chatDisplayRef.current.scrollHeight;
    }
  }, [state.messages]);

  websocketeer.on("SENT_MESSAGE", ({ message }) => {
    dispatch({ type: "SENT_MESSAGE", payload: message });
  });

  websocketeer.on("ENTERED_ROOM", ({ members, messages, room, error }) => {
    if (error) {
      return console.error(error);
    }
    dispatch({ type: "ENTERED_ROOM", payload: { members, messages, chatScope: { type: "Room", id: room.id, name: room.name } } });
  });

  websocketeer.on("LIST_ROOMS", ({ rooms, error }) => {
    if (error) {
      return console.error(error);
    }
    dispatch({ type: "SET_ROOMS", payload: rooms });
  });

  websocketeer.on("JOINED_ROOM", ({ rooms, error }) => {
    if (error) {
      return console.error(error);
    }
    dispatch({ type: "SET_ROOMS", payload: rooms });
  });

  websocketeer.on("UNJOINED_ROOM", ({ rooms, error }) => {
    if (error) {
      return console.error(error);
    }
    dispatch({ type: "SET_ROOMS", payload: rooms });
  });

  websocketeer.on("CREATED_ROOM", ({ rooms, error }) => {
    if (error) {
      return console.error(error);
    }
    dispatch({ type: "SET_ROOMS", payload: rooms });
  });

  function handleOpenJoinRoomModal(): void {
    setIsJoinRoomModalShown(true);
  }

  function handleOpenLeaveRoomModal(): void {
    setIsLeaveRoomModalShown(true);
  }

  function handleOpenCreateRoomModal(): void {
    setIsCreateRoomModalShown(true);
  }

  function handleMessageInputChange(e: ChangeEvent<HTMLTextAreaElement>): void {
    dispatch({ type: "SET_MESSAGE_TEXT", payload: e.target.value });
  }

  function handleMessageInputKeyDown(e: KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      if (state.messageText === "" || !state.chatScope) {
        return;
      }
      websocketeer.send("SEND_MESSAGE", { message: state.messageText, scope: state.chatScope.type });
    }
  }

  function handleSendMessage(): void {
    if (state.messageText === "" || !state.chatScope) {
      return;
    }
    websocketeer.send("SEND_MESSAGE", { message: state.messageText, scope: state.chatScope.type });
  }

  function handleOpenDirectMessagesDrawer(): void {
    setIsDirectMessagesShown(true);
  }

  function handleCloseDirectMessagesDrawer(): void {
    setIsDirectMessagesShown(false);
  }

  const handleCloseCreateRoomModal = useCallback(() => {
    setIsCreateRoomModalShown(false);
  }, []);

  const handleCloseJoinRoomModal = useCallback(() => {
    setIsJoinRoomModalShown(false);
  }, []);

  const handleCloseLeaveRoomModal = useCallback(() => {
    setIsLeaveRoomModalShown(false);
  }, []);

  const handleRoomClick = useCallback((roomId: string) => {
    dispatch({ type: "SET_IS_ENTERING_ROOM", payload: true });
    websocketeer.send("ENTER_ROOM", { id: roomId });
  }, []);

  // If we don't cache click handlers, rooms rerender a lot due to `onClick` being recreated.
  const roomClickHandlers = useMemo(() => {
    return new Map(state.rooms?.map((room) => [room.id, (): void => handleRoomClick(room.id)]));
  }, [state.rooms, handleRoomClick]);

  const renderRooms = useCallback(() => {
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
    <>
      <LeaveRoomModalMemo isOpen={isLeaveRoomModalShown} onClose={handleCloseLeaveRoomModal} selectedRoom={state.chatScope} />
      <CreateRoomModalMemo isOpen={isCreateRoomModalShown} onClose={handleCloseCreateRoomModal} />
      <JoinRoomModalMemo isOpen={isJoinRoomModalShown} onClose={handleCloseJoinRoomModal} />
      <TopbarMemo />
      <div className="container-fluid h-100 d-flex flex-column" style={{ paddingTop: "4em" }}>
        <div className="row text-center">
          <div className="col">
            <h1>{user?.name}</h1>
          </div>
        </div>
        <div className="row g-0 flex-fill justify-content-center min-h-0">
          <div
            id="members-offcanvas"
            className="card col-xl-2 col-3 d-lg-flex flex-column h-lg-90pct min-h-0 overf-hide offcanvas-lg offcanvas-start"
          >
            <div className="card-header d-flex flex-row display-6 text-center">
              <div className="flex-fill text-center">Members</div>
              <button
                className="btn btn-close btn-sm d-lg-none ms-auto"
                type="button"
                data-bs-dismiss="offcanvas"
                data-bs-target="#members-offcanvas"
              ></button>
            </div>
            <div id="members-container" className="card-body overf-y-scroll p-0 m-1">
              <ul className="list-group list-group-flush">
                {state.isEnteringRoom ? (
                  <LoadingSpinnerMemo />
                ) : (
                  state.members?.map((member) => (
                    <MemberMemo memberId={member.userId} key={member.userId} memberName={member.name} isOnline={member.isActive} />
                  ))
                )}
              </ul>
              <DirectMessagesDrawerMemo isShown={isDirectMessagesShown} onClose={handleCloseDirectMessagesDrawer} />
            </div>
            <div className="card-footer">
              <div className="row">
                <div className="col-12 d-flex p-1">
                  <button
                    onClick={handleOpenDirectMessagesDrawer}
                    className="btn btn-primary flex-grow-1 shadow"
                    type="button"
                    title="Direct Messages"
                  >
                    <i className="bi bi-chat-dots-fill"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="card col-lg-6 offset-lg-0 col-md-10 offset-md-0 h-90pct overf-hide d-flex">
            <div className="card-header d-flex flex-row">
              <div className="d-flex w-100 text-center justify-content-center align-items-center chat-title chat-title-no-room">
                {state.chatScope !== null && state.chatScope.name}
              </div>
            </div>
            <div ref={chatDisplayRef} className="card-body overf-y-scroll">
              {state.isEnteringRoom ? (
                <LoadingSpinnerMemo />
              ) : (
                state.messages?.map((message) => (
                  <MessageMemo messageId={message.messageId} key={message.messageId} message={message.message} from={message.userName || "-"} />
                ))
              )}
            </div>
            <div className="card-footer">
              <div className="input-group">
                <textarea
                  onChange={handleMessageInputChange}
                  onKeyDown={handleMessageInputKeyDown}
                  value={state.messageText}
                  className="form-control custom-control"
                  rows={3}
                  style={{ resize: "none" }}
                ></textarea>
                <button
                  onClick={handleSendMessage}
                  disabled={state.messageText === "" || state.chatScope === null}
                  className="input-group-addon btn btn-lg btn-primary"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
          <div id="rooms-offcanvas" className="card col-xl-2 col-3 d-lg-flex flex-column h-lg-90pct min-h-0 overf-hide offcanvas-lg offcanvas-end">
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
        </div>
      </div>
    </>
  );
}
