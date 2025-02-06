import React, { ReactNode, useMemo, useReducer } from "react";
import { initialChatState, chatReducer, ChatContext } from ".";

interface ChatProviderProperties {
  children: ReactNode;
}

export default function ChatProvider(props: ChatProviderProperties): React.JSX.Element {
  const [state, dispatch] = useReducer(chatReducer, initialChatState);
  const store = useMemo(() => ({ state, dispatch }), [state]);

  // prettier-ignore
  return (
    <ChatContext.Provider value={store}>
      {props.children}
    </ChatContext.Provider>
  )
}
