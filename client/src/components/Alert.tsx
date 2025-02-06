import React from "react";
import { BootstrapContextualClasses } from "../../types";

interface AlertProperties {
  isOpen: boolean;
  onClose: () => void;
  // Uses bootstrap-icons classes
  icon: string | null;
  type: BootstrapContextualClasses | null;
  rootClassName?: string;
  messageClassName?: string;
  children?: string;
}

export default function Alert(props: AlertProperties): React.JSX.Element {
  function formatType(type: string): string {
    return `alert-${type.toString()}`;
  }

  function setAlertMessageClasses(): string {
    return "" + props.messageClassName + " " + (props.icon === undefined ? "" : "ms-2");
  }

  return (
    <>
      {props.isOpen && (
        <div className={`alert ${props.rootClassName} ${props.type && formatType(props.type)}`} role="alert">
          <i className={`bi ${props.icon ?? props.icon}`}></i>
          <div id="alert-message" className={setAlertMessageClasses()}>
            {props?.children}
          </div>
          <button onClick={props.onClose} className="btn-close" type="button"></button>
        </div>
      )}
    </>
  );
}
