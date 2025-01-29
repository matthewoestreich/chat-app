import React, { InputHTMLAttributes, HTMLInputTypeAttribute } from "react";

interface InputElementAttributes extends InputHTMLAttributes<HTMLInputElement> {
  type?: HTMLInputTypeAttribute;
}

interface FloatingInputProperties {
  className?: string;
  inputProps?: InputElementAttributes;
  id: string;
  children?: string;
  invalidMessage: string;
}

export default function FloatingInput(props: FloatingInputProperties) {
  return (
    <div className={`form-floating ${props.className}`}>
      <input {...props.inputProps} id={props.id} className="form-control"></input>
      <label className="form-label" htmlFor={props.id}>{props.children}</label>
      <div className="invalid-feedback">{props.invalidMessage}</div>
    </div>
  )
}