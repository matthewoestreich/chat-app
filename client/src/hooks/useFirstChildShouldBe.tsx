import React, { ReactNode } from "react";

// Custom hook to validate if the first child is a specific component
export default function useFirstChildIsModalDialog<T>(children: ReactNode, shouldBeComponent: T): boolean {
  const firstChild = React.Children.toArray(children)[0];
  return React.isValidElement(firstChild) && firstChild.type === shouldBeComponent;
}
