import React, { ButtonHTMLAttributes } from "react";

interface ButtonLoadingProperties extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean;
  children?: string;
  size?: "sm" | "md" | "lg";
  loadingText?: string;
}

/**
 * A button that allows you to display a loading spinner within it.
 *
 * 'size' defaults to "sm" if not provided.
 *
 * @param props
 * @returns
 */
export default function ButtonLoading(props: ButtonLoadingProperties): React.JSX.Element {
  const { isLoading, children, size, loadingText, ...restOfProps } = props;

  return (
    <button {...restOfProps}>
      {isLoading === false && children}
      {isLoading && (
        <>
          {loadingText === undefined ? children : loadingText}
          <span className={`ms-1 spinner-border spinner-border-${size ? size.toString() : "sm"}`} role="status"></span>
        </>
      )}
    </button>
  );
}
