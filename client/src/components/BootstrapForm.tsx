import React, { FormEvent, forwardRef, ReactNode, useImperativeHandle, useRef } from "react";

interface BootstrapFormProperties {
  validated?: boolean;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  children?: ReactNode;
}

// BootstrapForm
export default forwardRef<BootstrapFormMethods, BootstrapFormProperties>((props, ref) => {
  const formRef = useRef<HTMLFormElement>(null);

  useImperativeHandle(ref, () => ({
    submitForm: (): void => {
      if (formRef.current) {
        const event = new Event("submit", { bubbles: true, cancelable: true });
        formRef.current.dispatchEvent(event);
      }
    },
    setIsValid: (isValid: boolean): void => {
      if (!formRef.current) {
        return;
      }
      formRef.current.classList.toggle("was-validated", isValid);
    },
  }));

  // Handle form submission
  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    event.stopPropagation();

    if (!formRef.current) {
      return;
    }

    formRef.current.classList.add("was-validated");
    if (props.onSubmit) {
      props.onSubmit(event);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className={props.validated ? "was-validated" : ""} noValidate>
      {props.children}
    </form>
  );
});
