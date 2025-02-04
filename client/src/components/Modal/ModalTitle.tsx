import React, { JSX } from "react";
import { RenderAs } from "@components";

type ModalTitleProps<T extends keyof JSX.IntrinsicElements> = {
  as: T;
  children?: React.ReactNode;
} & JSX.IntrinsicElements[T];

export default function ModalTitle(props: ModalTitleProps<keyof JSX.IntrinsicElements>): JSX.Element {
  const { as, children, className, ...rest } = props;
  return (
    <RenderAs as={as} className={className} {...rest}>
      {children}
    </RenderAs>
  );
}
