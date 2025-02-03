import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LoadingSpinner, Topbar, Room, Member, Message } from "@components";
import { useAuth, useWebSocketeer } from "@hooks";
import LeaveRoomModal from "./LeaveRoomModal";
import CreateRoomModal from "./CreateRoomModal";
import JoinRoomModal from "./JoinRoomModal";
import DirectMessagesDrawer from "./DirectMessagesDrawer";

document.title = "RTChat | Chat";

const LeaveRoomModalMemo = memo(LeaveRoomModal);
const CreateRoomModalMemo = memo(CreateRoomModal);
const JoinRoomModalMemo = memo(JoinRoomModal);
const DirectMessagesDrawerMemo = memo(DirectMessagesDrawer);
const LoadingSpinnerMemo = memo(LoadingSpinner);
const RoomMemo = memo(Room);
const MemberMemo = memo(Member);
const MessageMemo = memo(Message);

export default function ChatPage(): React.JSX.Element {
  const chatDisplayRef = useRef<HTMLDivElement>(null);

  const [isLeaveRoomModalShown, setIsLeaveRoomModalShown] = useState(false);
  const [isCreateRoomModalShown, setIsCreateRoomModalShown] = useState(false);
  const [isJoinRoomModalShown, setIsJoinRoomModalShown] = useState(false);
  const [isDirectMessagesShown, setIsDirectMessagesShown] = useState(false);
  const loadingSpinnerStyle = useMemo(() => ({ width: "5rem", height: "5rem" }), []);
  const { user } = useAuth();

  const [rooms, setRooms] = useState<IRoom[] | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [currentRoom, setCurrentRoom] = useState<IRoom | null>(null);
  const { websocketeer } = useWebSocketeer();

  // Scroll to bottom of chat display when we get messages
  useEffect(() => {
    if (chatDisplayRef.current && messages && messages.length > 0) {
      chatDisplayRef.current.scrollTop = chatDisplayRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    websocketeer.connect();

    websocketeer.on("RECEIVE_MESSAGE", ({ userId, userName, message }) => {
      console.log("Got message", { userId, userName, message });
    });

    websocketeer.on("ENTERED_ROOM", ({ members, messages }) => {
      setMembers(members);
      setMessages(messages);
    });

    websocketeer.on("LIST_ROOMS", ({ rooms }) => {
      setRooms(rooms);
    });

    websocketeer.on("JOINED_ROOM", ({ rooms }) => {
      setRooms(rooms);
    });

    websocketeer.on("UNJOINED_ROOM", ({ rooms }) => {
      console.log({ from: "unjoined room", rooms });
    });

    websocketeer.on("CREATED_ROOM", ({ rooms }) => {
      setRooms(rooms);
    });

    websocketeer.on("LIST_ROOM_MEMBERS", (/* why is payload unknown here? */) => {
      console.log({ from: "list room members" });
    });

    websocketeer.on("MEMBER_ENTERED_ROOM", ({ id }) => {
      console.log({ from: "member entered room", id });
    });

    websocketeer.on("MEMBER_LEFT_ROOM", ({ id }) => {
      console.log({ from: "member left room", id });
    });

    websocketeer.on("LIST_DIRECT_CONVERSATIONS", ({ directConversations }) => {
      console.log({ from: "list direct conversations", directConversations });
    });

    websocketeer.on("LIST_DIRECT_MESSAGES", ({ directMessages }) => {
      console.log({ from: "list direct messages", directMessages });
    });

    websocketeer.on("LIST_INVITABLE_USERS", ({ users }) => {
      console.log({ from: "list invitable users", users });
    });
  }, [websocketeer]);

  function handleOpenJoinRoomModal(): void {
    setIsJoinRoomModalShown(true);
  }

  function handleOpenLeaveRoomModal(): void {
    setIsLeaveRoomModalShown(true);
  }

  function handleOpenCreateRoomModal(): void {
    setIsCreateRoomModalShown(true);
  }

  function handleCloseLeaveRoomModal(): void {
    setIsLeaveRoomModalShown(false);
  }

  function handleCloseCreateRoomModal(): void {
    setIsCreateRoomModalShown(false);
  }

  function handleCloseJoinRoomModal(): void {
    setIsJoinRoomModalShown(false);
  }

  function handleOnLeaveRoom(): void {
    throw new Error("handleonleaveroom not impl");
  }

  function handleOpenDirectMessagesDrawer(): void {
    setIsDirectMessagesShown(true);
  }

  const handleCloseDirectMessagesDrawer = useCallback(() => {
    setIsDirectMessagesShown(false);
  }, []);

  // Create room onClick handler.
  // prettier-ignore
  const handleRoomClick = useCallback((roomId: string) => {
    setCurrentRoom((prev) => {
      if (prev?.id === roomId) {
        return prev;
      }
      websocketeer.send("ENTER_ROOM", { id: roomId });
      return rooms?.find((r) => r.id === roomId) || null;
    });
  }, [websocketeer, rooms]);

  // Create onClick handler specific to each room and store them to prevent unnecessary re-renders.
  const roomClickHandlers = useMemo(() => {
    return new Map(rooms?.map((room) => [room.id, (): void => handleRoomClick(room.id)]));
  }, [rooms, handleRoomClick]);

  const renderRooms = useCallback(() => {
    if (rooms === null) {
      return <LoadingSpinnerMemo style={loadingSpinnerStyle} />;
    }
    return rooms.map((room) => (
      <RoomMemo
        key={room.id}
        roomId={room.id}
        roomName={room.name}
        onClick={roomClickHandlers.get(room.id)}
        isSelected={currentRoom?.id === room.id}
      />
    ));
  }, [rooms, roomClickHandlers, loadingSpinnerStyle, currentRoom]);

  const renderMessages = useCallback(() => {
    if (messages === null) {
      return;
    }
    return messages.map((message) => (
      <MessageMemo messageId={message.messageId} key={message.messageId} message={message.message} from={message.userName || "-"} />
    ));
  }, [messages]);

  const renderMembers = useCallback(() => {
    if (members === null) {
      return <LoadingSpinnerMemo thickness=".5rem" style={loadingSpinnerStyle} />;
    }
    return (
      <ul id="members-list" className="list-group list-group-flush">
        {members.map((member) => (
          <MemberMemo memberId={member.userId} key={member.userId} memberName={member.name} isOnline={member.isActive} />
        ))}
      </ul>
    );
  }, [members, loadingSpinnerStyle]);

  return (
    <>
      <LeaveRoomModalMemo isOpen={isLeaveRoomModalShown} onClose={handleCloseLeaveRoomModal} onLeave={handleOnLeaveRoom} />
      <CreateRoomModalMemo isOpen={isCreateRoomModalShown} onClose={handleCloseCreateRoomModal} />
      <JoinRoomModalMemo isOpen={isJoinRoomModalShown} onClose={handleCloseJoinRoomModal} />
      <Topbar />
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
              {renderMembers()}
              <DirectMessagesDrawerMemo isShown={isDirectMessagesShown} onClose={handleCloseDirectMessagesDrawer} />
            </div>
            <div className="card-footer">
              <div className="row">
                <div className="col-12 d-flex p-1">
                  <button
                    onClick={handleOpenDirectMessagesDrawer}
                    id="open-direct-messages"
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
              <div id="chat-title" className="d-flex w-100 text-center justify-content-center align-items-center chat-title chat-title-no-room">
                {currentRoom === null ? "Please join a room" : currentRoom.name}
              </div>
            </div>
            <div ref={chatDisplayRef} id="chat-display" className="card-body overf-y-scroll">
              {renderMessages()}
            </div>
            <div className="card-footer">
              <div className="input-group">
                <textarea id="chat-text-input" className="form-control custom-control" rows={3} style={{ resize: "none" }}></textarea>
                <button id="send-chat-btn" className="input-group-addon btn btn-lg btn-primary">
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
                    disabled={currentRoom === null}
                  >
                    <i className="bi bi-box-arrow-down-left"></i>
                  </button>
                </div>
                <div className="col-4 d-flex p-1">
                  <button
                    onClick={handleOpenCreateRoomModal}
                    id="open-create-room-modal-btn"
                    className="btn btn-primary shadow flex-grow-1"
                    type="button"
                    title="Create Room"
                  >
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
