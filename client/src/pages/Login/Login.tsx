import React, { useRef } from "react";
import { FloatingInput } from "@components";
import CreateAccountModal from "./CreateAccountModal";

/**
 *
 * @returns React.JSX.Element
 */
export default function Login(): React.JSX.Element {
  const modalRef = useRef<ModalMethods>(null);

  const openModal = () => {
    modalRef.current?.show();
  }

  const closeModal = () => {
    modalRef.current?.hide();
  }

  return (
    <>
      <CreateAccountModal ref={modalRef} title="Create Account" />
      <div className="row">
        <div className="text-center mb-3">
          <h1 className="display-5">Welcome to RTChat!</h1>
        </div>
      </div>
      {/*  */}
      <div className="row" style={{ maxHeight: "400px" }}>
        <div className="col mh-100">
          <div id="alert-display" className="alert d-none d-flex flex-row align-items-center justify-content-between mh-100" role="alert">
            <i></i>
            <div id="alert-message" className="mb-0 max-h-100px overf-scroll"></div>
            <button onClick={closeModal} className="btn-close" type="button" data-bs-dismiss="alert">
              Close
            </button>
          </div>
        </div>
      </div>
      {/*  */}
      <div className="row w-100">
        <div className="col-lg-6 offset-lg-3">
          <div className="form-group">
            <form id="login-form">
              <FloatingInput id="login-email-input" className="mb-3" invalidMessage="Email is required!" inputProps={{ type: "text", placeholder: "Email Address", required: true, className: "form-control" }}>
                Email
              </FloatingInput>
              <FloatingInput id="login-pw-input" className="mb-3" invalidMessage="Password is required!" inputProps={{ type: "password", placeholder: "Password", required: true, className: "form-control" }}>
                Password
              </FloatingInput>
              <div className="d-flex justify-content-end">
                <button onClick={openModal} id="open-create-account-modal-btn" className="btn btn-outline-secondary me-2" type="button">
                  Create Account
                </button>
                <button id="login-btn" className="btn btn-primary">
                  Login
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
