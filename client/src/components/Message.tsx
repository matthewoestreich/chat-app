//import { useRenderCounter } from "@hooks";
import React, { HTMLAttributes } from "react";

interface MessageProperties extends HTMLAttributes<HTMLDivElement> {
  messageId?: string;
  message: string;
  from: string;
  isSender: boolean;
  isRead?: boolean;
  timestamp: Date;
  renderFrom?: boolean;
}

export default function Message(props: MessageProperties): React.JSX.Element {
  const { message, from, timestamp, isSender, renderFrom } = props;

  return (
    <div className={`chat-bubble bubble-${isSender ? "sent" : "received"}`}>
      {renderFrom === undefined || renderFrom === true ? (
        <div className="bubble-info">
          <span className="bubble-username">{from}</span>
        </div>
      ) : (
        <></>
      )}
      <div className="bubble-message">
        <p className="bubble-text">{message}</p>
        <span className="bubble-timestamp">{formatDate(timestamp)}</span>
      </div>
    </div>
  );
}

function formatDate(date: Date): string {
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}
