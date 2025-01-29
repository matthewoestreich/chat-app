import React, { InputHTMLAttributes } from "react";

interface FloatingInputProperties extends Omit<InputHTMLAttributes<HTMLInputElement>, "children"> {
  className?: string;
  id: string;
  children?: string;
  invalidMessage: string;
}

export default function FloatingInput(props: FloatingInputProperties): React.JSX.Element {
  const { className, id, children, invalidMessage, ...inputProps } = props;

  return (
    <div className={`form-floating ${className ?? ""}`}>
      <input {...inputProps} id={id} className="form-control" />
      <label className="form-label" htmlFor={id}>
        {children}
      </label>
      <div className="invalid-feedback">{invalidMessage}</div>
    </div>
  );
}
