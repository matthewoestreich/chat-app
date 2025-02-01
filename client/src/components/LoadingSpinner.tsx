import React, { CSSProperties, HTMLAttributes } from "react";

type SpinnerStyle = CSSProperties & Record<string, string | number>;

interface LoadingSpinnerProperties extends HTMLAttributes<HTMLDivElement> {
  isShown?: boolean;
  containerClassName?: string;
  visuallyHiddenText?: string;
  style?: SpinnerStyle;
  thickness?: string;
}

export default function LoadingSpinner(props: LoadingSpinnerProperties): React.JSX.Element {
  const { containerClassName, visuallyHiddenText, style, isShown, ...restOfProps } = props;
  return (
    <>
      {(isShown === true || isShown === undefined) && (
        <div className={`container d-flex flex-column h-100 justify-content-center align-items-center ${containerClassName || ""}`}>
          <div
            {...restOfProps}
            style={{ ...style, "--bs-spinner-border-width": props.thickness } as unknown as SpinnerStyle}
            className="spinner-border"
            role="status"
          >
            <span className="visually-hidden">{visuallyHiddenText || "Loading..."}</span>
          </div>
        </div>
      )}
    </>
  );
}
