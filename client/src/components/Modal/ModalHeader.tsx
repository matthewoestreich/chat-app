import React, { HTMLAttributes } from "react";

interface ModalHeaderProperties extends HTMLAttributes<HTMLDivElement> {}

export default function ModalHeader(props: ModalHeaderProperties): React.JSX.Element {
  const { children, className, ...restOfProps } = props;

  return (
    <div className={`modal-header ${className || ""}`} {...restOfProps}>
      {children}
    </div>
  );
}
