//import { useRenderCounter } from "@hooks";
import React, { LiHTMLAttributes } from "react";

interface MemberProperties extends LiHTMLAttributes<HTMLLIElement> {
  memberId?: string;
  memberName: string;
  isOnline: boolean;
  isButton?: boolean;
  isSelected?: boolean;
}

const INTENTIONAL_SPACE = " ";

export default function Member(props: MemberProperties): React.JSX.Element {
  //const count = useRenderCounter(`Member ${props.memberName}`);
  //console.log(count);

  const { isOnline, isSelected, isButton, memberId, memberName, className, ...restOfProps } = props;

  return (
    // prettier-ignore
    <li
      // @ts-ignore
      type={isButton === true ? "button" : ""}
      className={`list-group-item d-flex justify-content-between align-items-start ${className !== undefined ? className : ""} ${isSelected === true ? "active" : ""}`}
      {...restOfProps}
    >
      <div className="ms-2 me-auto">
        <div>{memberName}</div>
      </div>
      <span className={`badge rounded-pill ${isOnline ? "text-bg-success" : "text-bg-warning"}`}>{INTENTIONAL_SPACE}</span>
    </li>
  );
}
