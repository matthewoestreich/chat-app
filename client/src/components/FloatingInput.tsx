import React, { useId, InputHTMLAttributes } from "react";

interface FloatingInputProperties extends Omit<InputHTMLAttributes<HTMLInputElement>, "children" | "id"> {
  invalidMessage: string;
  className?: string;
  children?: string;
  inputClassName?: string;
}

export default function FloatingInput(props: FloatingInputProperties): React.JSX.Element {
  const id = useId();

  const { className, children, invalidMessage, inputClassName, ...inputProps } = props;

  return (
    <div className={`form-floating ${className ?? ""}`}>
      <input id={id} {...inputProps} className={`form-control ${inputClassName}`} />
      <label className="form-label" htmlFor={id}>
        {children}
      </label>
      <div className="invalid-feedback mt-0">{invalidMessage}</div>
    </div>
  );
}
