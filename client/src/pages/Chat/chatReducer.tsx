interface ChatState {
  rooms: IRoom[] | null;
  members: RoomMember[] | null;
  messages: PublicMessage[] | null;
  chatScope: ChatScope | null;
  messageText: string;
  isEnteringRoom: boolean;
}

type ChatStateAction =
  | { type: "SET_ROOMS"; payload: IRoom[] | null }
  | { type: "SET_MEMBERS"; payload: RoomMember[] | null }
  | { type: "SET_MESSAGES"; payload: PublicMessage[] | null }
  | { type: "SET_CHAT_SCOPE"; payload: ChatScope | null }
  | { type: "SET_MESSAGE_TEXT"; payload: string }
  | { type: "SET_IS_ENTERING_ROOM"; payload: boolean }
  | { type: "SENT_MESSAGE"; payload: PublicMessage }
  | { type: "ENTERED_ROOM"; payload: { messages: PublicMessage[] | null; members: RoomMember[] | null; chatScope: ChatScope } };

export default function chatReducer(state: ChatState, action: ChatStateAction): ChatState {
  switch (action.type) {
    case "SET_ROOMS":
      return { ...state, rooms: action.payload };
    case "SET_MEMBERS":
      return { ...state, members: action.payload };
    case "SET_MESSAGES":
      return { ...state, messages: action.payload };
    case "SET_CHAT_SCOPE":
      return { ...state, chatScope: action.payload };
    case "SET_MESSAGE_TEXT":
      return { ...state, messageText: action.payload };
    case "SET_IS_ENTERING_ROOM":
      return { ...state, isEnteringRoom: action.payload };
    case "SENT_MESSAGE":
      return {
        ...state,
        messages: [...(state.messages || []), action.payload],
        messageText: "",
      };
    case "ENTERED_ROOM":
      return {
        ...state,
        messages: action.payload.messages,
        members: action.payload.members,
        chatScope: action.payload.chatScope,
        isEnteringRoom: false,
      };
    default:
      return state;
  }
}
