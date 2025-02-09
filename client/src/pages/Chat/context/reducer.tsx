import { ChatScope, PublicDirectConversation, PublicMessage, Room, PublicMember } from "@root/types.shared";
import sortMembers from "../sortMembers";

export interface ChatState {
  rooms: Room[] | null;
  directConversations: PublicDirectConversation[] | null;
  members: PublicMember[] | null;
  messages: PublicMessage[] | null;
  chatScope: ChatScope | null;
  isEnteringRoom: boolean;
  isJoinDirectConversationModalOpen: boolean;
}

export type ChatStateAction =
  | { type: "AFTER_CONNECTION_ESTABLISHED"; payload: { rooms: Room[]; directConversations: PublicDirectConversation[] } }
  | { type: "SET_ROOMS"; payload: Room[] | null }
  | { type: "SET_MEMBERS"; payload: PublicMember[] | null }
  | { type: "SET_MESSAGES"; payload: PublicMessage[] | null }
  | { type: "SET_DIRECT_CONVERSATIONS"; payload: PublicDirectConversation[] | null }
  | { type: "JOINED_DIRECT_CONVERSATION"; payload: { directConversations: PublicDirectConversation[]; scope: ChatScope } }
  | { type: "SET_CHAT_SCOPE"; payload: ChatScope | null }
  | { type: "SET_IS_ENTERING_ROOM"; payload: boolean }
  | { type: "SENT_MESSAGE"; payload: PublicMessage }
  | { type: "RECEIVE_MESSAGE"; payload: PublicMessage }
  | { type: "AFTER_UNJOINED_ROOM"; payload: Room[] }
  | { type: "SET_MEMBER_ACTIVE_STATUS"; payload: { userId: string; isActive: boolean } }
  | { type: "ENTERED_ROOM"; payload: { messages: PublicMessage[] | null; members: PublicMember[] | null; chatScope: ChatScope | null } }
  | { type: "ENTERED_DIRECT_CONVERSATION"; payload: { scope: ChatScope } }
  | { type: "SET_IS_JOIN_DIRECT_CONVERSATION_MODAL_OPEN"; payload: boolean };

export default function chatReducer(state: ChatState, action: ChatStateAction): ChatState {
  switch (action.type) {
    case "AFTER_CONNECTION_ESTABLISHED": {
      return { ...state, rooms: action.payload.rooms, directConversations: action.payload.directConversations };
    }
    case "SET_ROOMS": {
      return { ...state, rooms: action.payload };
    }
    case "SET_MEMBERS": {
      return { ...state, members: action.payload };
    }
    case "SET_MESSAGES": {
      return { ...state, messages: action.payload };
    }
    case "SET_CHAT_SCOPE": {
      return { ...state, chatScope: action.payload };
    }
    case "SET_DIRECT_CONVERSATIONS": {
      if (!action.payload) {
        return state;
      }
      return { ...state, directConversations: sortMembers(action.payload, true) };
    }
    case "JOINED_DIRECT_CONVERSATION": {
      // TODO improve this logic
      // Update member with scopeId
      const index = state.members?.findIndex((member) => member.userId === action.payload.scope.userId);
      let copy: PublicMember[] = [];
      if (index && index !== -1) {
        copy = [...(state.members || [])];
        copy[index].scopeId = action.payload.scope.id;
      }
      const updatedState = {
        ...state,
        directConversations: sortMembers(action.payload.directConversations, true),
        chatScope: action.payload.scope,
      };
      if (copy.length) {
        updatedState.members = copy;
      }
      return updatedState;
    }
    case "SET_IS_ENTERING_ROOM": {
      return { ...state, isEnteringRoom: action.payload };
    }
    case "SET_IS_JOIN_DIRECT_CONVERSATION_MODAL_OPEN": {
      return { ...state, isJoinDirectConversationModalOpen: action.payload };
    }
    case "AFTER_UNJOINED_ROOM": {
      return { ...state, rooms: action.payload, members: null, messages: null, chatScope: null };
    }
    case "SET_MEMBER_ACTIVE_STATUS": {
      const memberIndex = state.members?.findIndex((m) => m.userId === action.payload.userId);
      const directConversationIndex = state.directConversations?.findIndex((dc) => dc.userId === action.payload.userId);
      let tempMembers = state.members || [];
      let tempDirectConvos = state.directConversations || [];

      if (memberIndex !== undefined && memberIndex !== -1) {
        tempMembers = [...(state.members || [])];
        tempMembers[memberIndex].isActive = action.payload.isActive;
      }
      if (directConversationIndex !== undefined && directConversationIndex !== -1) {
        tempDirectConvos = [...(state.directConversations || [])];
        tempDirectConvos[directConversationIndex].isActive = action.payload.isActive;
      }

      return { ...state, members: sortMembers(tempMembers, true), directConversations: sortMembers(tempDirectConvos, true) };
    }
    case "SENT_MESSAGE": {
      const copy = [...(state.messages || [])];
      copy.push(action.payload);
      return {
        ...state,
        messages: copy,
      };
    }
    case "RECEIVE_MESSAGE": {
      const copy = [...(state.messages || [])];
      copy.push(action.payload);
      return { ...state, messages: copy };
    }
    case "ENTERED_ROOM": {
      return {
        ...state,
        messages: action.payload.messages,
        members: action.payload.members,
        chatScope: action.payload.chatScope,
        isEnteringRoom: false,
      };
    }
    default: {
      return state;
    }
  }
}
