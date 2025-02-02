import React, { HTMLAttributes } from "react";

interface RoomProperties extends HTMLAttributes<HTMLLIElement> {
  roomId: string;
  name: string;
  subText?: string;
  isSelected?: boolean;
}

export default function Room(props: RoomProperties): React.JSX.Element {
  return (
    <li
      className={`list-group-item p-1 border-0 ${props.className !== undefined ? props.className : ""} ${props.isSelected !== undefined && "active-room"}`}
    >
      <div className="card" role="button">
        <div className="card-body">
          <h5 className="card-title">{props.name}</h5>
          {props?.subText !== undefined && <p className="card-text">{props.subText}</p>}
        </div>
      </div>
    </li>
  );
}

/*
<li class="list-group-item p-1 border-0" id="0193bc9f-6219-748c-9493-2342f04d57f6" name="#general" data-bs-dismiss="offcanvas" data-bs-target="#rooms-offcanvas">
  <div class="card" role="button">
    <div class="card-body">
      <h5 class="card-title">#general</h5>
      <p class="card-text"></p>
    </div>
  </div>
</li>
*/
