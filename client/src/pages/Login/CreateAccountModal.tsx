import React, { ChangeEvent, FormEvent, HTMLAttributes, KeyboardEvent, useEffect, useRef, useState } from "react";
import { Modal as BsModal } from "bootstrap";
// prettier-ignore
import { 
  Modal,
  ModalDialog,
  ModalContent,
  InputFloating,
  Form,
  ButtonLoading,
  ModalHeader,
  ModalBody,
  ModalFooter
} from "@components";
import { sendRegisterRequest } from "@src/auth/authService";

interface CreateAccountModalProperties extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onCreate: (registerResult: CreateAccountResult) => void;
  onClose: () => void;
  title: string;
}

// CreateAccountModal
export default function CreateAccountModal(props: CreateAccountModalProperties): React.JSX.Element {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [modalInstance, setModalInstance] = useState<InstanceType<typeof BsModal> | null>(null);
  const [isCloseButtonDisabled, setIsCloseButtonDisabled] = useState(false);
  const [isFormValidated, setIsFormValidated] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (modalInstance) {
      if (props.isOpen === true) {
        modalInstance.show();
      } else if (props.isOpen === false) {
        modalInstance.hide();
      }
    }
  }, [props.isOpen, modalInstance]);

  function handleGetModalInstance(instance: BsModal | null): void {
    setModalInstance(instance);
  }

  function handleUsernameInput(event: ChangeEvent<HTMLInputElement>): void {
    setUsername(event.target.value);
  }

  function handlePasswordInput(event: ChangeEvent<HTMLInputElement>): void {
    setPassword(event.target.value);
  }

  function handleEmailInput(event: ChangeEvent<HTMLInputElement>): void {
    setEmail(event.target.value);
  }

  function handleClose(): void {
    props.onClose();
    resetModal();
  }

  function handleGetFormRef(current: HTMLFormElement | null): void {
    formRef.current = current;
  }

  // Programmatically submit form.
  function handleSubmitClick(): void {
    formRef.current?.requestSubmit();
  }

  function handleInputKeydown(e: KeyboardEvent<HTMLInputElement>): void {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      // Submit form
      handleSubmitClick();
    }
  }

  async function handleSubmitForm(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    if (!formRef) {
      return;
    }
    // `.checkValidity()` comes from Bootstrap
    const isFormValid = event.currentTarget.checkValidity();
    setIsFormValidated(true);
    if (!isFormValid) {
      return;
    }
    setIsCloseButtonDisabled(true);
    setIsCreatingAccount(true);
    const result = await sendRegisterRequest(username, password, email);
    props.onCreate(result);
    props.onClose();
    resetModal();
  }

  function resetModal(): void {
    [setEmail, setUsername, setPassword].forEach((setInputState) => setInputState(""));
    setIsFormValidated(false);
    setIsCreatingAccount(false);
    setIsCloseButtonDisabled(false);
  }

  return (
    <Modal getInstance={handleGetModalInstance} className="fade modal-lg" dataBsBackdrop="static" dataBsKeyboard={false}>
      <ModalDialog>
        <ModalContent>
          <ModalHeader>
            <h1 className="modal-title fs-5">{props.title}</h1>
            <button tabIndex={-1} onClick={handleClose} className="btn btn-close" type="button"></button>
          </ModalHeader>
          <ModalBody>
            <div className="form-group">
              <Form getRef={handleGetFormRef} onSubmit={handleSubmitForm} validated={isFormValidated}>
                <InputFloating
                  tabIndex={1}
                  className="mb-3"
                  type="text"
                  placeholder="Username"
                  required={true}
                  invalidMessage="Username is required!"
                  onKeyDown={handleInputKeydown}
                  onChange={handleUsernameInput}
                  value={username}
                >
                  Username
                </InputFloating>
                <InputFloating
                  tabIndex={2}
                  className="mb-3"
                  type="email"
                  placeholder="Email"
                  required={true}
                  invalidMessage="Email is required!"
                  extraText="Use a fake one if you'd like!"
                  onKeyDown={handleInputKeydown}
                  onChange={handleEmailInput}
                  value={email}
                >
                  Email
                </InputFloating>
                <InputFloating
                  tabIndex={3}
                  className="mb-3"
                  type="password"
                  placeholder="Password"
                  required={true}
                  invalidMessage="Password is required!"
                  onKeyDown={handleInputKeydown}
                  onChange={handlePasswordInput}
                  value={password}
                >
                  Password
                </InputFloating>
              </Form>
            </div>
          </ModalBody>
          <ModalFooter>
            <button onClick={handleClose} className="btn btn-danger" type="button" disabled={isCloseButtonDisabled}>
              Close
            </button>
            <ButtonLoading onClick={handleSubmitClick} isLoading={isCreatingAccount} type="button" className="btn btn-primary">
              Create Account
            </ButtonLoading>
          </ModalFooter>
        </ModalContent>
      </ModalDialog>
    </Modal>
  );
}
