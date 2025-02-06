//import { useRenderCounter } from "@hooks";
import React, { HTMLAttributes } from "react";

interface RoomProperties extends HTMLAttributes<HTMLLIElement> {
  roomId: string;
  roomName: string;
  subText?: string;
  isSelected?: boolean;
}

export default function Room(props: RoomProperties): React.JSX.Element {
  //const renderCount = useRenderCounter(`Room ${props.roomName}`);
  //console.log(renderCount);
  const { className, isSelected, roomId, subText, roomName, ...restOfProps } = props;

  return (
    <li className={`list-group-item p-1 border-0 ${className ?? className} ${isSelected === true && "active-room"}`} {...restOfProps}>
      <div className="card" role="button">
        <div className="card-body">
          <h5 className="card-title">{roomName}</h5>
          {props?.subText !== undefined && <p className="card-text">{subText}</p>}
        </div>
      </div>
    </li>
  );
}
