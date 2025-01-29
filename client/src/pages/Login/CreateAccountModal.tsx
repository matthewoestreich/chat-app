import React, { forwardRef, HTMLAttributes } from "react";
import { Modal, ModalDialog, ModalContent, FloatingInput } from "@components";

interface CreateAccountModalProperties extends HTMLAttributes<HTMLDivElement> {
  onCreate: () => void;
  onClose: () => void;
  title: string;
}

// CreateAccountModal
export default forwardRef<ModalMethods, CreateAccountModalProperties>((props, ref) => {
  return (
    <Modal ref={ref} classes={["fade", "modal-lg"]} dataBsBackdrop="static" dataBsKeyboard={false}>
      <ModalDialog>
        <ModalContent>
          <div className="modal-header">
            <h1 className="modal-title fs-5">{props.title}</h1>
            <button id="close-modal-btn" className="btn btn-close" type="button" data-bs-dismiss="modal"></button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <form id="form">
                <FloatingInput
                  id="ca-un-input"
                  className="mb-3"
                  type="text"
                  placeholder="Username"
                  required={true}
                  invalidMessage="Username is required!"
                >
                  Username
                </FloatingInput>
                <FloatingInput
                  id="ca-email-input"
                  className="mb-3"
                  type="email"
                  placeholder="Email"
                  required={true}
                  invalidMessage="Email is required!"
                >
                  Email
                </FloatingInput>
                <FloatingInput
                  id="ca-pw-input"
                  className="mb-3"
                  type="password"
                  placeholder="Password"
                  required={true}
                  invalidMessage="Username is required!"
                >
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
        </ModalContent>
      </ModalDialog>
    </Modal>
  );
});
