import React, { HTMLAttributes } from "react";

interface ModalFooterProperties extends HTMLAttributes<HTMLDivElement> {}

export default function ModalFooter(props: ModalFooterProperties): React.JSX.Element {
  const { children, className, ...restOfProps } = props;

  return (
    <div className={`modal-footer ${className || ""}`} {...restOfProps}>
      {children}
    </div>
  );
}
