import React, { ChangeEvent, useRef, useState, MouseEvent } from "react";
import { FloatingInput, Alert } from "@components";
import { useSetCookie } from "@hooks";
import CreateAccountModal from "./CreateAccountModal";
import sendLoginRequest from "./sendLoginRequest";

interface AlertStatus {
  type?: BootstrapContextualClasses;
  shown: boolean;
  message?: string;
  icon?: string;
}

/**
 *
 * @returns React.JSX.Element
 */
export default function Login(): React.JSX.Element {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [alert, setAlert] = useState<AlertStatus>({ type: undefined, shown: false });
  const modalRef = useRef<ModalMethods>(null);
  const setCookie = useSetCookie();

  function handleEmailInput(event: ChangeEvent<HTMLInputElement>): void {
    setEmail(() => event.target.value);
  }

  function handlePasswordInput(event: ChangeEvent<HTMLInputElement>): void {
    setPassword(() => event.target.value);
  }

  async function handleLogin(event: MouseEvent<HTMLButtonElement>): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    if (email === "" || password === "") {
      console.error("Missing email or pw", { email, password });
      setAlert({ type: "danger", shown: true, message: "Missing email or password!", icon: "bi-exclamation-triangle-fill" });
    }

    const loginResult = await sendLoginRequest(email, password);
    if (loginResult.ok) {
      setAlert({ type: "success", shown: true, message: "Success!", icon: "bi-success" });
      setCookie("session", loginResult.session, 1);
      return;
    }
    setAlert({ type: "danger", shown: true, message: "Something went wrong :(", icon: "bi-exclamation-triangle-fill" });
  }

  function openModal(): void {
    modalRef.current?.show();
  }

  function closeModal(): void {
    modalRef.current?.hide();
  }

  function closeAlert(): void {
    setAlert({ type: undefined, shown: false, message: "", icon: "" });
  }

  return (
    <>
      <CreateAccountModal ref={modalRef} title="Create Account" onCreate={() => {}} onClose={closeModal} />
      <div className="row">
        <div className="text-center mb-3">
          <h1 className="display-5">Welcome to RTChat!</h1>
        </div>
      </div>
      {/*  */}
      <div className="row" style={{ maxHeight: "400px" }}>
        <div className="col mh-100">
          <Alert
            isOpen={alert.shown}
            onClose={closeAlert}
            rootClassName="d-flex flex-row align-items-center justify-content-between mh-100"
            messageClassName="mb-0 max-h-100px overf-scroll"
            icon={alert.icon}
            type={alert.type}
          >
            {alert.message}
          </Alert>
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
                <button onClick={handleLogin} className="btn btn-primary">
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
