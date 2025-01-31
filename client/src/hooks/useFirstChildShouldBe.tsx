import React, { ReactNode, isValidElement } from "react";

// Custom hook to validate if the first child is a specific component
export default function useFirstChildShouldBe<T>(children: ReactNode, shouldBeComponent: T): boolean {
  const firstChild = React.Children.toArray(children)[0];
  return isValidElement(firstChild) && firstChild.type === shouldBeComponent;
}
