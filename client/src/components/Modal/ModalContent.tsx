import React, { HTMLAttributes } from "react";

interface ModalContentProperties extends HTMLAttributes<HTMLDivElement> {}

export default function ModalContent(props: ModalContentProperties): React.JSX.Element {
  const { children, className, ...restOfProps } = props;

  return (
    <div className={`modal-content ${className || ""}`} {...restOfProps}>
      {children}
    </div>
  );
}
