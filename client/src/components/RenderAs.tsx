import React, { FC, JSX } from "react";

type RenderAsProps<T extends keyof JSX.IntrinsicElements> = {
  as: T;
  children?: React.ReactNode;
} & JSX.IntrinsicElements[T];

// eslint-disable-next-line
const RenderAs: FC<RenderAsProps<any>> = ({ as: Component, children, ...props }) => {
  return <Component {...props}>{children}</Component>;
};

export default RenderAs;
