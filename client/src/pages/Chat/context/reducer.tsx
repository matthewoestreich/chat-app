import { ChatScope, DirectMessage, PublicDirectConversation, PublicMessage, Room, PublicMember } from "@root/types.shared";
import sortMembers from "../sortMembers";

export interface ChatState {
  rooms: Room[] | null;
  directConversations: PublicDirectConversation[] | null;
  directMessages: DirectMessage[] | null;
  members: PublicMember[] | null;
  messages: PublicMessage[] | null;
  chatScope: ChatScope | null;
  isEnteringRoom: boolean;
  isJoinDirectConversationModalOpen: boolean;
}

export type ChatStateAction =
  | { type: "SET_ROOMS"; payload: Room[] | null }
  | { type: "SET_MEMBERS"; payload: PublicMember[] | null }
  | { type: "SET_MESSAGES"; payload: PublicMessage[] | null }
  | { type: "SET_DIRECT_CONVERSATIONS"; payload: PublicDirectConversation[] | null }
  | { type: "SET_DIRECT_MESSAGES"; payload: DirectMessage[] | null }
  | { type: "SET_CHAT_SCOPE"; payload: ChatScope | null }
  | { type: "SET_IS_ENTERING_ROOM"; payload: boolean }
  | { type: "SENT_MESSAGE"; payload: PublicMessage }
  | { type: "SET_MEMBER_ACTIVE_STATUS"; payload: { userId: string; isActive: boolean } }
  | { type: "ENTERED_ROOM"; payload: { messages: PublicMessage[] | null; members: PublicMember[] | null; chatScope: ChatScope | null } }
  | { type: "SET_IS_JOIN_DIRECT_CONVERSATION_MODAL_OPEN"; payload: boolean };

export default function chatReducer(state: ChatState, action: ChatStateAction): ChatState {
  switch (action.type) {
    case "SET_ROOMS": {
      console.log("setRooms");
      return { ...state, rooms: action.payload };
    }
    case "SET_MEMBERS": {
      console.log("setMembers");
      return { ...state, members: action.payload };
    }
    case "SET_MESSAGES": {
      console.log("setMessages");
      return { ...state, messages: action.payload };
    }
    case "SET_CHAT_SCOPE": {
      console.log("setchatScope");
      return { ...state, chatScope: action.payload };
    }
    case "SET_DIRECT_CONVERSATIONS": {
      console.log("setDirctConvos");
      if (!action.payload) {
        return state;
      }
      return { ...state, directConversations: sortMembers(action.payload, true) };
    }
    case "SET_DIRECT_MESSAGES": {
      console.log("setDirectMEssages");
      return { ...state, directMessages: action.payload, messages: null };
    }
    case "SET_IS_ENTERING_ROOM": {
      console.log("isenteringroom");
      return { ...state, isEnteringRoom: action.payload };
    }
    case "SET_IS_JOIN_DIRECT_CONVERSATION_MODAL_OPEN": {
      return { ...state, isJoinDirectConversationModalOpen: action.payload };
    }
    case "SET_MEMBER_ACTIVE_STATUS": {
      console.log("setmemberactiveStatus");
      const memberIndex = state.members?.findIndex((m) => m.userId === action.payload.userId);
      let tempMembers = state.members || [];
      if (memberIndex && memberIndex !== -1) {
        tempMembers = [...(state.members || [])];
        tempMembers[memberIndex].isActive = action.payload.isActive;
      }

      const directConversationIndex = state.directConversations?.findIndex((dc) => dc.userId === action.payload.userId);
      let tempDirectConvos = state.directConversations || [];
      if (directConversationIndex && directConversationIndex !== -1) {
        tempDirectConvos = [...(state.directConversations || [])];
        tempDirectConvos[directConversationIndex].isActive = action.payload.isActive;
      }

      return { ...state, members: sortMembers(tempMembers, true), directConversations: sortMembers(tempDirectConvos, true) };
    }
    case "SENT_MESSAGE": {
      return {
        ...state,
        messages: [...(state.messages ?? []), action.payload],
      };
    }
    case "ENTERED_ROOM": {
      console.log("enteredRoom");
      return {
        ...state,
        messages: action.payload.messages,
        members: action.payload.members,
        chatScope: action.payload.chatScope,
        isEnteringRoom: false,
      };
    }
    default: {
      console.log("default");
      return state;
    }
  }
}
