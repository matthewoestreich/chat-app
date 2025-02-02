import React, { LiHTMLAttributes } from "react";

interface JoinableRoomProperties extends LiHTMLAttributes<HTMLLIElement> {
  name: string;
  roomId: string;
  text?: string;
  isSelected: boolean;
}

export default function JoinableRoom(props: JoinableRoomProperties): React.JSX.Element {
  return (
    <li
      onClick={props?.onClick}
      id={props.roomId}
      // @ts-ignore
      type="button"
      className={`list-group-item list-group-item-action ${props.className !== null ? props.className : ""} ${props.isSelected ? "active" : ""}`}
    >
      <div className="fw-bold fs-5">{props.name}</div>
      {props?.text !== undefined && <p style={{ fontSize: "0.6em" }}>{props.text}</p>}
    </li>
  );
}
