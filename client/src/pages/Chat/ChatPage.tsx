import React, { useState } from "react";
import { LoadingSpinner, Topbar } from "@components";
import { useAuth } from "@hooks";
import LeaveRoomModal from "./LeaveRoomModal";
import CreateRoomModal from "./CreateRoomModal";
import JoinRoomModal from "./JoinRoomModal";
import DirectMessagesDrawer from "./DirectMessagesDrawer";
import "../../styles/chat.css";

export default function ChatPage(): React.JSX.Element {
  document.title = "RTChat | Chat";

  const [currentRoom] = useState(null);

  const [isLeaveRoomModalShown, setIsLeaveRoomModalShown] = useState(false);
  const [isCreateRoomModalShown, setIsCreateRoomModalShown] = useState(false);
  const [isJoinRoomModalShown, setIsJoinRoomModalShown] = useState(false);

  const { logout, user } = useAuth();

  function handleOpenJoinRoomModal(): void {
    setIsJoinRoomModalShown(true);
  }

  function handleOpenLeaveRoomModal(): void {
    setIsLeaveRoomModalShown(true);
  }

  function handleOpenCreateRoomModal(): void {
    setIsCreateRoomModalShown(true);
  }

  async function handleLogout(): Promise<void> {
    logout();
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

  function handleOnCreateRoom(result: CreateRoomResult): void {
    throw new Error(`oncreateroomhandler not impl ${result}`);
  }

  function handleOnJoinRoom(result: JoinRoomResult): void {
    throw new Error(`onjoinroomhandler notimpl ${result}`);
  }

  return (
    <>
      <LeaveRoomModal isOpen={isLeaveRoomModalShown} onClose={handleCloseLeaveRoomModal} onLeave={handleOnLeaveRoom} />
      <CreateRoomModal isOpen={isCreateRoomModalShown} onClose={handleCloseCreateRoomModal} onCreate={handleOnCreateRoom} />
      <JoinRoomModal isOpen={isJoinRoomModalShown} onClose={handleCloseJoinRoomModal} onJoin={handleOnJoinRoom} />
      <Topbar onLogoutClick={handleLogout} />
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
              <div className="flex-fill text-center">
                Members
                <button
                  className="btn btn-close btn-sm d-lg-none ms-auto"
                  type="button"
                  data-bs-dismiss="offcanvas"
                  data-bs-target="#members-offcanvas"
                ></button>
              </div>
            </div>
            <div id="members-container" className="card-body overf-y-scroll p-0 m-1">
              <LoadingSpinner isShown={true} thickness=".5rem" style={{ width: "5rem", height: "5rem" }} />
              <ul id="members-list" className="list-group list-group-flush"></ul>
              <DirectMessagesDrawer isShown={false} />
            </div>
            <div className="card-footer">
              <div className="row">
                <div className="col-12 d-flex p-1">
                  <button id="open-direct-messages" className="btn btn-primary flex-grow-1 shadow" type="button" title="Direct Messages">
                    <i className="bi bi-chat-dots-fill"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="card col-lg-6 offset-lg-0 col-md-10 offset-md-0 h-90pct overf-hide d-flex">
            <div className="card-header d-flex flex-row">
              <div id="chat-title" className="d-flex w-100 text-center justify-content-center align-items-center chat-title chat-title-no-room">
                Please join a room
              </div>
            </div>
            <div id="chat-display" className="card-body overf-y-scroll"></div>
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
                className="btn btn-clise btn-sm d-lg-none ms-auto shadow"
                type="button"
                data-bs-dismiss="offcanvas"
                data-bs-target="#rooms-offcanvas"
              ></button>
            </div>
            <div id="rooms-container" className="card-body overf-y-scroll p-0 m-1">
              <LoadingSpinner isShown={true} thickness=".5rem" style={{ width: "5rem", height: "5rem" }} />
            </div>
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
