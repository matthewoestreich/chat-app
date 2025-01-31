import React, { useId, InputHTMLAttributes } from "react";

interface InputFloatingProperties extends Omit<InputHTMLAttributes<HTMLInputElement>, "children" | "id"> {
  invalidMessage: string;
  className?: string;
  children?: string;
  inputClassName?: string;
  // This is smaller text under the input
  extraText?: string;
}

export default function FloatingInput(props: InputFloatingProperties): React.JSX.Element {
  const id = useId();

  const { className, children, invalidMessage, inputClassName, extraText, ...inputProps } = props;

  return (
    <div className={`form-floating ${className === undefined ? "" : className}`}>
      <input id={id} {...inputProps} className={`form-control ${inputClassName === undefined ? "" : inputClassName}`} />
      <label className="form-label" htmlFor={id}>
        {children}
      </label>
      {extraText !== undefined && <div className="form-text">{extraText}</div>}
      <div className="invalid-feedback mt-0">{invalidMessage}</div>
    </div>
  );
}
