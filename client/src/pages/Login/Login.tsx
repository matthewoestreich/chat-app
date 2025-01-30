import React, { ChangeEvent, useRef, useState, FormEvent } from "react";
import { FloatingInput, Alert, BootstrapForm, ButtonLoading } from "@components";
import { useSetCookie } from "@hooks";
import { sendLoginRequest } from "@client/auth/authService";
import CreateAccountModal from "./CreateAccountModal";
import { useNavigate } from "react-router-dom";

export default function Login(): React.JSX.Element {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [alert, setAlert] = useState<AlertState>({ type: undefined, shown: false });
  const [isFormValidated, setIsFormValidated] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigate = useNavigate();
  const modalRef = useRef<ModalMethods>(null);
  const setCookie = useSetCookie();

  function handleEmailInput(event: ChangeEvent<HTMLInputElement>): void {
    setEmail(() => event.target.value);
  }

  function handlePasswordInput(event: ChangeEvent<HTMLInputElement>): void {
    setPassword(() => event.target.value);
  }

  function handleCreateAccountResult(result: CreateAccountResult): void {
    setAlert(
      result.ok
        ? { type: "success", icon: "bi-person-fill-check", message: "Success!", shown: true }
        : { type: "danger", icon: "bi-exclamation-triangle-fill", message: "Something went wrong :(", shown: true },
    );
    modalRef.current?.hide();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    const form = event.currentTarget;
    const isFormValid = form.checkValidity();
    setIsFormValidated(true);

    if (!isFormValid) {
      return;
    }

    try {
      setIsLoggingIn(true);
      const loginResult = await sendLoginRequest(email, password);

      if (!loginResult.ok) {
        setAlert({ type: "danger", shown: true, message: "Something went wrong :(", icon: "bi-exclamation-triangle-fill" });
        setIsLoggingIn(false);
        return;
      }

      setAlert({ type: "success", shown: true, message: "Success!", icon: "bi-person-fill-check" });
      setCookie("session", loginResult.session, 1);
      navigate("/chat");
    } catch (_e) {
      setAlert({ type: "danger", shown: true, message: "Something went wrong :(", icon: "bi-exclamation-triangle-fill" });
      setIsLoggingIn(false);
    }
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
      <CreateAccountModal ref={modalRef} title="Create Account" onCreate={handleCreateAccountResult} onClose={closeModal} />
      <div className="row">
        <div className="text-center mb-3">
          <h1 className="display-5">Welcome to RTChat!</h1>
        </div>
      </div>
      <div className="row" style={{ maxHeight: "400px" }}>
        <div className="col mh-100">
          <Alert
            isOpen={alert.shown}
            icon={alert.icon}
            type={alert.type}
            onClose={closeAlert}
            rootClassName="d-flex flex-row align-items-center justify-content-between mh-100"
            messageClassName="mb-0 max-h-100px overf-scroll"
          >
            {alert.message}
          </Alert>
        </div>
      </div>
      <div className="row w-100">
        <div className="col-lg-6 offset-lg-3">
          <div className="form-group">
            <BootstrapForm onSubmit={handleSubmit} validated={isFormValidated}>
              <FloatingInput
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
                <ButtonLoading isLoading={isLoggingIn} type="submit" className="btn btn-primary">
                  Login
                </ButtonLoading>
              </div>
            </BootstrapForm>
          </div>
        </div>
      </div>
    </>
  );
}
