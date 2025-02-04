import React, { HTMLAttributes } from "react";

interface ModalBodyProperties extends HTMLAttributes<HTMLDivElement> {}

export default function ModalBody(props: ModalBodyProperties): React.JSX.Element {
  const { children, className, ...restOfProps } = props;

  return (
    <div className={`modal-body ${className || ""}`} {...restOfProps}>
      {children}
    </div>
  );
}
