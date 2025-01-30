import React, { ChangeEvent, FormEvent, forwardRef, HTMLAttributes, useRef, useState } from "react";
import { Modal, ModalDialog, ModalContent, FloatingInput, BootstrapForm, ButtonLoading } from "@components";
import { sendRegisterRequest } from "@client/auth/authService";

interface CreateAccountModalProperties extends HTMLAttributes<HTMLDivElement> {
  onCreate: (registerResult: CreateAccountResult) => void;
  onClose: () => void;
  title: string;
}

// CreateAccountModal
export default forwardRef<ModalMethods, CreateAccountModalProperties>((props, ref) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [isFormValidated, setIsFormValidated] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const formRef = useRef<BootstrapFormMethods | null>(null);

  function handleUsernameInput(event: ChangeEvent<HTMLInputElement>): void {
    setUsername(event.target.value);
  }

  function handlePasswordInput(event: ChangeEvent<HTMLInputElement>): void {
    setPassword(event.target.value);
  }

  function handleEmailInput(event: ChangeEvent<HTMLInputElement>): void {
    setEmail(event.target.value);
  }

  function handleSubmitClick(): void {
    formRef.current?.submitForm();
  }

  async function handleSubmitForm(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    if (!formRef.current) {
      return;
    }

    const isFormValid = event.currentTarget.checkValidity();
    formRef.current.setIsValid(isFormValid);
    setIsFormValidated(true);

    if (!isFormValid) {
      return;
    }

    setIsCreatingAccount(true);
    const result = await sendRegisterRequest(username, password, email);
    props.onCreate(result);
    setIsCreatingAccount(false);
    props.onClose();
  }

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
              <BootstrapForm ref={formRef} onSubmit={handleSubmitForm} validated={isFormValidated}>
                <FloatingInput
                  id="ca-un-input"
                  className="mb-3"
                  type="text"
                  placeholder="Username"
                  required={true}
                  invalidMessage="Username is required!"
                  onChange={handleUsernameInput}
                  value={username}
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
                  onChange={handleEmailInput}
                  value={email}
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
                  onChange={handlePasswordInput}
                  value={password}
                >
                  Password
                </FloatingInput>
              </BootstrapForm>
            </div>
          </div>
          <div className="modal-footer">
            <button id="cancel-btn" className="btn btn-danger" type="button" data-bs-dismiss="modal">
              Close
            </button>
            <ButtonLoading onClick={handleSubmitClick} isLoading={isCreatingAccount} type="button" className="btn btn-primary">
              Create Account
            </ButtonLoading>
          </div>
        </ModalContent>
      </ModalDialog>
    </Modal>
  );
});
