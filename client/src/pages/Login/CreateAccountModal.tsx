import React, { ForwardedRef, forwardRef, HTMLAttributes, useRef } from "react";
import { Modal, ModalDialog, FloatingInput } from "@components";

interface CreateAccountModalProperties extends HTMLAttributes<HTMLDivElement> {
  title: string;
}

// CreateAccountModal
export default forwardRef<ModalMethods, CreateAccountModalProperties>((props, ref) => {
  return (
    <Modal ref={ref} classes={["fade", "modal-lg"]} dataBsBackdrop="static" dataBsKeyboard={false}>
      <ModalDialog>
        <div className="modal-content">
          <div className="modal-header">
            <h1 className="modal-title fs-5">{props.title}</h1>
            <button id="close-modal-btn" className="btn btn-close" type="button" data-bs-dismiss="modal"></button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <form id="form">
                <FloatingInput id="ca-un-input" className="mb-3" inputProps={{ type: "text", placeholder: "Username" }} invalidMessage="Username is required!">
                  Username
                </FloatingInput>
                <FloatingInput id="ca-email-input" className="mb-3" inputProps={{ type: "email", placeholder: "Email" }} invalidMessage="Email is required!">
                  Email
                </FloatingInput>
                <FloatingInput id="ca-pw-input" className="mb-3" inputProps={{ type: "password", placeholder: "Password", required: true }} invalidMessage="Username is required!">
                  Password
                </FloatingInput>
              </form>
            </div>
          </div>
          <div className="modal-footer">
            <button id="cancel-btn" className="btn btn-danger" type="button" data-bs-dismiss="modal">
              Close
            </button>
            <button id="create-btn" className="btn btn-primary" type="button">
              Create Account
            </button>
          </div>
        </div>
      </ModalDialog>
    </Modal>
  );
});
