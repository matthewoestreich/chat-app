//import { useRenderCounter } from "@hooks";
import React, { LiHTMLAttributes } from "react";

interface DirectConversationProperties extends LiHTMLAttributes<HTMLLIElement> {
  memberId?: string;
  memberName: string;
  isOnline: boolean;
  isButton?: boolean;
  isSelected?: boolean;
  numUnreadMessages?: number;
}

const INTENTIONAL_SPACE = " ";

export default function DirectConversation(props: DirectConversationProperties): React.JSX.Element {
  //const count = useRenderCounter(`Member ${props.memberName}`);
  //console.log(count);

  const { numUnreadMessages, isOnline, isSelected, isButton, memberId, memberName, className, ...restOfProps } = props;

  return (
    // prettier-ignore
    <li
      // @ts-ignore
      type={isButton === true ? "button" : ""}
      className={`list-group-item d-flex justify-content-between align-items-start ${className !== undefined ? className : ""} ${isSelected === true ? "active" : ""}`}
      {...restOfProps}
    >
      <div className="ms-2 me-auto">
        <div>
          {memberName}
          {numUnreadMessages !== undefined && numUnreadMessages > 0 && (
            <span className="ms-1 position-absolute badge rounded-pill bg-danger">
              {numUnreadMessages}
              <span className="visually-hidden">unread messages</span>
            </span>
          )}
        </div>
      </div>
      <span className={`badge rounded-pill ${isOnline ? "text-bg-success" : "text-bg-warning"}`}>{INTENTIONAL_SPACE}</span>
    </li>
  );
}

/* FOR DIRECT MESSAGES
<li type="button" class="list-group-item d-flex justify-content-between align-items-start  " id="0194fb84-ff75-722a-b6e5-c4c931dbfb01"><div class="ms-2 me-auto">
  <div>
    adrian.wyman
    <span class="ms-1 position-absolute badge rounded-pill bg-danger">
      99+
      <span class="visually-hidden">unread messages</span>
    </span>
  </div>
</div><span class="badge rounded-pill text-bg-warning"> </span></li>
*/
