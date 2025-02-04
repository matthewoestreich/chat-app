import React, { ChangeEvent, useState, FormEvent } from "react";
import { InputFloating, Alert, Form, ButtonLoading, Topbar } from "@components";
import { useAuth } from "@hooks";
import CreateAccountModal from "./CreateAccountModal";

export default function LoginPage(): React.JSX.Element {
  //useSetPageTitle("RTChat | Welcome!");
  document.title = "RTChat | Welcome!";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [alert, setAlert] = useState<AlertState>({ type: null, shown: false, icon: null });
  const [isFormValidated, setIsFormValidated] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isCreateAccountModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const { login } = useAuth();

  function handleEmailInput(event: ChangeEvent<HTMLInputElement>): void {
    setEmail(event.target.value);
  }

  function handlePasswordInput(event: ChangeEvent<HTMLInputElement>): void {
    setPassword(event.target.value);
  }

  function handleCreateAccountResult(result: CreateAccountResult): void {
    setAlert(
      result.ok
        ? { type: "success", icon: "bi-person-fill-check", message: "Success!", shown: true }
        : { type: "danger", icon: "bi-exclamation-triangle-fill", message: "Something went wrong :(", shown: true },
    );
  }

  function handleCloseCreateAccountModal(): void {
    setIsCreateRoomModalOpen(false);
  }

  function handleOpenCreateAccountModal(): void {
    setIsCreateRoomModalOpen(true);
  }

  function handleCloseAlert(): void {
    setAlert({ type: null, shown: false, message: "", icon: "" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    const form = event.currentTarget;
    // checkValidity comes from Bootstrap
    const isFormValid = form.checkValidity();
    setIsFormValidated(true);
    if (!isFormValid) {
      return;
    }
    setIsLoggingIn(true);
    login(email, password);
    setIsLoggingIn(false);
  }

  return (
    <div className="container d-flex flex-column h-100 justify-content-center align-items-center">
      <CreateAccountModal
        isOpen={isCreateAccountModalOpen}
        title="Create Account"
        onCreate={handleCreateAccountResult}
        onClose={handleCloseCreateAccountModal}
      />
      <Topbar showLogoutButton={false} />
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
            onClose={handleCloseAlert}
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
            <Form onSubmit={handleSubmit} validated={isFormValidated}>
              <InputFloating
                className="mb-3"
                invalidMessage="Email is required!"
                type="text"
                placeholder="Email Address"
                required={true}
                onChange={handleEmailInput}
                value={email}
              >
                Email
              </InputFloating>
              <InputFloating
                className="mb-3"
                invalidMessage="Password is required!"
                type="password"
                placeholder="Password"
                required={true}
                onChange={handlePasswordInput}
                value={password}
              >
                Password
              </InputFloating>
              <div className="d-flex justify-content-end">
                <button onClick={handleOpenCreateAccountModal} className="btn btn-outline-secondary me-2" type="button">
                  Create Account
                </button>
                <ButtonLoading isLoading={isLoggingIn} type="submit" className="btn btn-primary">
                  Login
                </ButtonLoading>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
