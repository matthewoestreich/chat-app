import React, { ChangeEvent, useRef, useState } from "react";
import { FloatingInput } from "@components";
import CreateAccountModal from "./CreateAccountModal";

/**
 *
 * @returns React.JSX.Element
 */
export default function Login(): React.JSX.Element {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const modalRef = useRef<ModalMethods>(null);

  const handleEmailInput = (event: ChangeEvent<HTMLInputElement>): void => {
    setEmail(() => event.target.value);
  };

  const handlePasswordInput = (event: ChangeEvent<HTMLInputElement>): void => {
    setPassword(() => event.target.value);
  };

  const openModal = (): void => {
    modalRef.current?.show();
  };

  const closeModal = (): void => {
    modalRef.current?.hide();
  };

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
              <FloatingInput
                id="login-email-input"
                className="mb-3"
                invalidMessage="Email is required!"
                type="text"
                placeholder="Email Address"
                required={true}
                onChange={handleEmailInput}
                value={email}
              >
                Email
              </FloatingInput>
              <FloatingInput
                id="login-pw-input"
                className="mb-3"
                invalidMessage="Password is required!"
                type="password"
                placeholder="Password"
                required={true}
                onChange={handlePasswordInput}
                value={password}
              >
                Password
              </FloatingInput>
              <div className="d-flex justify-content-end">
                <button onClick={openModal} className="btn btn-outline-secondary me-2" type="button">
                  Create Account
                </button>
                <button className="btn btn-primary">Login</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
