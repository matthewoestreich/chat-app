import { useRenderCounter } from "@hooks";
import React, { LiHTMLAttributes } from "react";

interface MemberProperties extends LiHTMLAttributes<HTMLLIElement> {
  memberId?: string;
  memberName: string;
  isOnline: boolean;
}

const INTENTIONAL_SPACE = " ";

export default function Member(props: MemberProperties): React.JSX.Element {
  const renderCount = useRenderCounter(`Member ${props.memberId || props.memberName}`);
  console.log(renderCount);

  return (
    <li className="list-group-item d-flex justify-content-between align-items-start">
      <div className="ms-2 me-auto">
        <div>{props.memberName}</div>
      </div>
      <span className={`badge rounded-pill ${props.isOnline ? "text-bg-success" : "text-bg-warning"}`}>{INTENTIONAL_SPACE}</span>
    </li>
  );
}
