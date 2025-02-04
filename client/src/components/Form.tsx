import React, { FormEvent, HTMLAttributes, ReactNode, useEffect, useRef } from "react";

/**
 * HOW TO:
 * 
=====================================================================================================
 - Submit form via submit button (type="submit", aka a button within the form)
 - Form validation
=====================================================================================================
-----------------------------------------------------------------------------------------------------
function MyComponent() {
  // NOTE this is setting whether the form was VALIDATED __not__ if the form is VALID!!!!!
  const [validated, setValidated] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    const form = event.currentTarget;
    const isFormValid = form.checkValidity();
    setValidated(true);
    if (isFormValid) {
      // ...
    } else {
      // ...
    }
  }

  return (
    <BootstrapForm onSubmit={handleSubmit} validated={validated}>
      // Inputs...

      // Button inside of form
      <button type="submit">Submit</button>
    </BootstrapForm>
  )
} 
-----------------------------------------------------------------------------------------------------
 *
 * 
=====================================================================================================
 - Programmatically submit form (aka from a button outside of the form)
 - Form validation
=====================================================================================================
function MyComponent() {
  // NOTE this is setting whether the form was VALIDATED __not__ if the form is VALID!!!!!
  const [validated, setValidated] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  function handleGetFormRef(current: HTMLFormElement | null): void {
    formRef.current = current;
  }

  // Programmatically submit form.
  function handleSubmitClick(): void {
    formRef.current?.requestSubmit();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    const form = event.currentTarget;
    const isFormValid = form.checkValidity();
    setValidated(true);
    if (isFormValid) {
      // ...
    } else {
      // ...
    }
  }

  return (
    <div>
      <BootstrapForm getRef={handleGetFormRef} onSubmit={handleSubmit} validated={validated}>
        // Inputs, etc...
      </BootstrapForm>

      // Button outside of form...
      <button onClick={handleSubmitClick}>Submit</button>
    </div>
  )
} 
-----------------------------------------------------------------------------------------------------
 *
 */
interface FormProperties extends HTMLAttributes<HTMLFormElement> {
  validated?: boolean;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  children?: ReactNode;
  getRef?: (ref: HTMLFormElement | null) => void;
}

export default function Form(props: FormProperties): React.JSX.Element {
  const formRef = useRef<HTMLFormElement>(null);
  const { validated, onSubmit, children, getRef, className, ...restOfProps } = props;

  useEffect(() => getRef?.(formRef.current), [getRef]);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    event.stopPropagation();
    if (!formRef.current) {
      return;
    }
    formRef.current.classList.add("was-validated");
    onSubmit?.(event);
  }

  // prettier-ignore
  return (
    <form 
      {...restOfProps} 
      ref={formRef} 
      onSubmit={handleSubmit} 
      className={`${validated ? "was-validated" : ""} ${className || ""}`} 
      noValidate
    >
      {children}
    </form>
  );
}
