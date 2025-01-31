import React from "react";

interface DirectMessagesDrawerProperties {
  isShown: boolean;
}

export default function DirectMessagesDrawer(props: DirectMessagesDrawerProperties): React.JSX.Element {
  return (
    <>
      {props.isShown && (
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
      )}
    </>
  );
}
