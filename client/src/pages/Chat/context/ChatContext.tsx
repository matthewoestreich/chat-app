import { createContext, Dispatch } from "react";
import { ChatState, ChatStateAction } from "./reducer";

export interface ChatContextValue {
  state: ChatState;
  dispatch: Dispatch<ChatStateAction>;
}

export const initialChatState: ChatState = {
  rooms: null,
  directConversations: null,
  directMessages: null,
  members: null,
  messages: null,
  chatScope: null,
  isEnteringRoom: false,
};

const ChatContext = createContext<ChatContextValue>({
  state: initialChatState,
  dispatch: () => {},
});

export default ChatContext;
