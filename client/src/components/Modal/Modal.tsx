import React, { HTMLAttributes, ReactNode, useEffect, useRef } from "react";
import { Modal as BsModal } from "bootstrap";
import { useFirstChildShouldBe } from "@hooks";
import ModalDialog from "./ModalDialog";

/**
 *
 */
interface ModalProperties extends HTMLAttributes<HTMLDivElement> {
  getInstance?: (bsModal: BsModal | null) => void;
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

  const modalRef = useRef<HTMLDivElement | null>(null);
  const getInstance = props.getInstance;

  useEffect(() => {
    if (getInstance) {
      if (modalRef.current) {
        const bsModal = BsModal.getOrCreateInstance(modalRef.current) || new BsModal(modalRef.current);
        getInstance(bsModal);
      }
    }
  }, [getInstance]);

  const modalSize = props?.size === undefined ? "modal-md" : `modal-${props.size}`;

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
