import React, { LiHTMLAttributes } from "react";

interface MemberProperties extends LiHTMLAttributes<HTMLLIElement> {
  memberId?: string;
  memberName: string;
  isOnline: boolean;
  isButton?: boolean;
}

const INTENTIONAL_SPACE = " ";

export default function Member(props: MemberProperties): React.JSX.Element {
  return (
    // prettier-ignore
    <li
      // @ts-ignore
      type={props.isButton === true ? "button" : ""}
      className="list-group-item d-flex justify-content-between align-items-start"
    >
      <div className="ms-2 me-auto">
        <div>{props.memberName}</div>
      </div>
      <span className={`badge rounded-pill ${props.isOnline ? "text-bg-success" : "text-bg-warning"}`}>{INTENTIONAL_SPACE}</span>
    </li>
  );
}
