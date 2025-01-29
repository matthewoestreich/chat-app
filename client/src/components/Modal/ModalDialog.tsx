import React, { HTMLAttributes } from 'react';

interface ModalDialogProperties extends HTMLAttributes<HTMLDivElement> {}

export default function ModalDialog(props: ModalDialogProperties) {
  return (
    <div className="modal-dialog">
      {props.children}
    </div>
  )
}