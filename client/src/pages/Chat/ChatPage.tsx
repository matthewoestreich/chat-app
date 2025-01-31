import { useAuth } from "@hooks";
import React from "react";
import { useNavigate } from "react-router-dom";
import { sendLogoutRequest } from "@client/auth/authService";
import "../../styles/chat.css";

export default function ChatPage(): React.JSX.Element {
  document.title = "RTChat | Chat";
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  async function handleLogout(): Promise<void> {
    await sendLogoutRequest();
    logout();
    navigate("/");
  }

  return (
    <>
      <header className="navbar navbar-expand-lg fixed-top bg-secondary-subtle">
        <nav className="container">
          <div className="me-auto">
            <span className="navbar-brand">RTChat</span>
          </div>
          <div className="mx-auto">
            <a className="navbar-icon d-inline-block d-lg-none" data-bs-toggle="offcanvas" data-bs-target="#members-offcanvas">
              <button className="btn btn-primary shadow" type="button" title="View Members">
                <i className="bi bi-people-fill"></i>
              </button>
            </a>
            <></>
            <a className="navbar-icon d-inline-block d-lg-none">
              <button
                className="btn btn-primary shadow"
                type="button"
                title="View Rooms"
                data-bs-toggle="offcanvas"
                data-bs-target="#rooms-offcanvas"
              >
                <i className="bi bi-door-open-fill"></i>
              </button>
            </a>
          </div>
          <div className="ms-auto g-1">
            <a id="toggle-theme" className="navbar-icon" title="Toggle theme">
              <button className="btn btn-light shadow">
                <i id="dark-theme-icon" className="bi bi-moon-fill"></i>
                <i id="light-theme-icon" className="d-none bi bi-sun-fill"></i>
              </button>
            </a>
            <a className="navbar-icon" onClick={handleLogout}>
              <button className="btn btn-light flex-fill shadow" type="button" title="Logout">
                <i className="bi bi-power"></i>
              </button>
            </a>
          </div>
        </nav>
      </header>
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
              <div id="loading-members-spinner" className="d-none d-flex mt-4 justify-content-center">
                <div className="spinner-border">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
              <ul id="members-list" className="list-group list-group-flush"></ul>
              <div id="direct-messages-drawer" className="drawer card">
                <div className="drawer-header card-header fs-3">
                  <div className="flex-fill text-center">Direct Messages</div>
                  <button id="close-direct-messages-drawer" className="btn btn-close btn-sm drawer-close-button" type="button"></button>
                </div>
                <div id="direct-messages-container" className="drawer-body card-body"></div>
                <div className="card-footer">
                  <div className="row">
                    <div className="col-4 d-flex p-1">
                      <button id="create-direct-conversation-btn" className="btn btn-success shadow flex-grow-1" type="button" title="New">
                        <i className="bi bi-person-plus-fill"></i>
                      </button>
                    </div>
                    <div className="col-4 d-flex p-1">
                      <button id="leave-direct-conversation-btn" className="btn btn-warning shadow flex-grow-1" type="button" title="Leave">
                        <i className="bi bi-person-dash-fill"></i>
                      </button>
                    </div>
                    <div className="col-4 d-flex-p-1">
                      <button id="close-dms-footer-btn" className="btn btn-danger shadow flex-grow-1" type="button" title="Close Direct Messages">
                        <i className="bi bi-x-square"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
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
              <div id="loading-rooms-spinner" className="d-flex mt-4 justify-content-center">
                <div className="spinner-border">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            </div>
            <div className="card-footer">
              <div className="row">
                <div className="col-4 d-flex p-1">
                  <button id="open-join-room-modal" className="btn btn-primary shadow flex-grow-1" type="button" title="Join Room">
                    <i className="bi bi-box-arrow-in-up-right"></i>
                  </button>
                </div>
                <div className="col-4 d-flex p-1">
                  <button id="open-leave-room-modal" className="btn btn-warning shadow flex-grow-1" type="button" title="Leave Current Room" disabled>
                    <i className="bi bi-box-arrow-down-left"></i>
                  </button>
                </div>
                <div className="col-4 d-flex p-1">
                  <button id="open-create-room-modal-btn" className="btn btn-primary shadow flex-grow-1" type="button" title="Create Room">
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
