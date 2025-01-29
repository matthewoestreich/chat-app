import React, { HTMLAttributes } from "react";
import { useFirstChildShouldBe } from "@hooks";
import { ModalContent } from "@components";

interface ModalDialogProperties extends HTMLAttributes<HTMLDivElement> {}

export default function ModalDialog(props: ModalDialogProperties): React.JSX.Element {
  const { children, className, ...restOfProps } = props;
  const isFirstChildModalContent = useFirstChildShouldBe(children, ModalContent);
  if (!isFirstChildModalContent) {
    console.warn("[ModalDialog] firt child not ModalContent! This may cause issues.");
  }

  return (
    <div className={`modal-dialog ${className}`} {...restOfProps}>
      {children}
    </div>
  );
}
