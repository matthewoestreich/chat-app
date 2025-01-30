import React, { forwardRef, HTMLAttributes, ReactNode, useImperativeHandle, useRef, useState } from "react";
import * as bootstrap from "bootstrap";
import { useFirstChildShouldBe } from "@hooks";
import ModalDialog from "./ModalDialog";

interface ModalProperties extends HTMLAttributes<HTMLDivElement> {
  classes?: string[];
  dataBsBackdrop?: "static" | boolean;
  dataBsKeyboard?: boolean;
  tabIndex?: number;
  children?: ReactNode;
}

export default forwardRef<ModalMethods, ModalProperties>(function (props, ref) {
  const isFirstChildModalDialog = useFirstChildShouldBe(props.children, ModalDialog);
  if (!isFirstChildModalDialog) {
    console.warn("[Modal] firt child not ModalDialog! This may cause issues.");
  }

  const modalRef = useRef<HTMLDivElement | null>(null);
  const [modalInstance, setModalInstance] = useState<InstanceType<typeof bootstrap.Modal> | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      show: (): void => {
        if (modalRef.current) {
          const instance = bootstrap.Modal.getInstance(modalRef.current) || new bootstrap.Modal(modalRef.current);
          setModalInstance(instance);
          instance.show();
        }
      },
      hide: (): void => {
        modalInstance?.hide();
      },
    }),
    [modalInstance],
  );

  return (
    <div
      ref={modalRef}
      id={props.id}
      className={`modal ${props.classes?.join(" ") || ""}`}
      data-bs-backdrop={props.dataBsBackdrop ?? "static"}
      data-bs-keyboard={props.dataBsKeyboard ?? true}
      tabIndex={props.tabIndex ?? -1}
    >
      {props.children}
    </div>
  );
});
