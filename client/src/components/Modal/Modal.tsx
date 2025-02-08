import React, { HTMLAttributes, ReactNode, useEffect, useRef } from "react";
import { Modal as BsModal } from "bootstrap";
import { useFirstChildShouldBe } from "@hooks";
import ModalDialog from "./ModalDialog";

/**
 *
 */
interface ModalProperties extends HTMLAttributes<HTMLDivElement> {
  //getInstance?: (bsModal: BsModal | null) => void;
  shown: boolean;
  dataBsBackdrop?: "static" | boolean;
  dataBsKeyboard?: boolean;
  tabIndex?: number;
  children?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export default function Modal(props: ModalProperties): React.JSX.Element {
  const isFirstChildModalDialog = useFirstChildShouldBe(props.children, ModalDialog);
  if (!isFirstChildModalDialog) {
    console.warn("[Modal] firt child not ModalDialog! This may cause issues.");
  }

  const bsModalInstance = useRef<BsModal | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const modalSize = props?.size === undefined ? "modal-md" : `modal-${props.size}`;

  useEffect(() => {
    console.log(`modalRef || modalRef.current changed`, { modalRef, current: modalRef.current });
    if (modalRef.current) {
      bsModalInstance.current = BsModal.getOrCreateInstance(modalRef.current);
    }
  }, [modalRef]);

  if (props.shown === true) {
    if (bsModalInstance.current) {
      bsModalInstance.current.show();
    }
  } else if (props.shown === false) {
    if (modalRef.current && bsModalInstance.current) {
      bsModalInstance.current.hide();
    }
  }

  return (
    <div
      ref={modalRef}
      className={`modal ${modalSize} ${props.className || ""}`}
      data-bs-backdrop={props.dataBsBackdrop ?? "static"}
      data-bs-keyboard={props.dataBsKeyboard ?? true}
      tabIndex={props.tabIndex ?? -1}
    >
      {props.children}
    </div>
  );
}
