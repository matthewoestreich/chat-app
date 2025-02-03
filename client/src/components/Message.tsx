import React, { HTMLAttributes, useMemo } from "react";

interface MessageProperties extends HTMLAttributes<HTMLDivElement> {
  messageId?: string;
  message: string;
  from: string;
  headerProps?: HTMLAttributes<HTMLSpanElement>;
  messageProps?: HTMLAttributes<HTMLDivElement>;
}

export default function Message(props: MessageProperties): React.JSX.Element {
  const messageStyle = useMemo(() => ({ marginTop: "0.67rem" }), []);

  const { message, from, headerProps, messageProps } = props;

  return (
    <div className="message" style={messageStyle}>
      <span className="message-header" {...headerProps}>
        {from}
      </span>
      <div className="message-body" {...messageProps}>
        {message}
      </div>
    </div>
  );
}
