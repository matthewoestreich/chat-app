import { ChatScope, PublicDirectConversation, PublicMessage, Room, PublicMember } from "@root/types.shared";
import sortPublicMembers from "../sortPublicMembers";
import sortPublicDirectConversations from "../sortPublicDirectConversations";

export interface ChatState {
  rooms: Room[] | null;
  directConversations: PublicDirectConversation[] | null;
  members: PublicMember[] | null;
  messages: PublicMessage[] | null;
  chatScope: ChatScope | null;
  isEnteringRoom: boolean;
  isCreateDirectConversationModalOpen: boolean;
  isLeaveDirectConversationModalOpen: boolean;
}

export type ChatStateAction =
  | { type: "SET_ROOMS"; payload: Room[] | null }
  | { type: "SET_MEMBERS"; payload: PublicMember[] | null }
  | { type: "SET_MESSAGES"; payload: PublicMessage[] | null }
  | { type: "SET_DIRECT_CONVERSATIONS"; payload: PublicDirectConversation[] }
  | { type: "SET_CHAT_SCOPE"; payload: ChatScope | null }
  | { type: "SET_IS_ENTERING_ROOM"; payload: boolean }
  | { type: "SENT_MESSAGE"; payload: PublicMessage }
  | { type: "RECEIVE_MESSAGE"; payload: PublicMessage }
  | { type: "AFTER_UNJOINED_ROOM"; payload: Room[] }
  | { type: "LEFT_DIRECT_CONVERSATION"; payload: PublicDirectConversation[] }
  | { type: "SET_MEMBER_ACTIVE_STATUS"; payload: { userId: string; isActive: boolean } }
  | { type: "SET_IS_CREATE_DIRECT_CONVERSATION_MODAL_OPEN"; payload: boolean }
  | { type: "SET_IS_LEAVE_DIRECT_CONVERSATION_MODAL_OPEN"; payload: boolean }
  | {
      type: "ENTERED_ROOM";
      payload: {
        messages: PublicMessage[] | null;
        members: PublicMember[] | null;
        chatScope: ChatScope | null;
      };
    }
  | {
      type: "ENTERED_DIRECT_CONVERSATION";
      payload: {
        chatScope: ChatScope;
        messages: PublicMessage[];
      };
    }
  | {
      type: "AFTER_CONNECTION_ESTABLISHED";
      payload: {
        rooms: Room[];
        directConversations: PublicDirectConversation[];
        defaultRoom?: {
          room: Room;
          members: PublicMember[];
          messages: PublicMessage[];
        };
      };
    };

export default function chatReducer(state: ChatState, action: ChatStateAction): ChatState {
  switch (action.type) {
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
    case "ENTERED_DIRECT_CONVERSATION": {
      const newState = {
        ...state,
        chatScope: action.payload.chatScope,
        messages: action.payload.messages,
        members: [],
      };
      // Find other member of convo so we can set unread messages to 0 (since we have now read them by entering this convo).
      const otherPersonIndex = newState.directConversations?.findIndex((convo) => convo.scopeId === action.payload.chatScope.id);
      if (!newState.directConversations || otherPersonIndex === undefined || otherPersonIndex === -1) {
        return newState;
      }
      if (newState.directConversations[otherPersonIndex].unreadMessagesCount > 0) {
        newState.directConversations[otherPersonIndex].unreadMessagesCount = 0;
      }
      sortPublicDirectConversations(newState.directConversations, false);
      return newState;
    }
    case "SET_DIRECT_CONVERSATIONS": {
      return { ...state, directConversations: sortPublicDirectConversations(action.payload, true) };
    }
    case "SET_IS_ENTERING_ROOM": {
      return { ...state, isEnteringRoom: action.payload };
    }
    case "LEFT_DIRECT_CONVERSATION": {
      const copy = sortPublicDirectConversations(action.payload, true);
      return { ...state, directConversations: copy, messages: [], chatScope: null };
    }
    case "SET_IS_CREATE_DIRECT_CONVERSATION_MODAL_OPEN": {
      return { ...state, isCreateDirectConversationModalOpen: action.payload };
    }
    case "SET_IS_LEAVE_DIRECT_CONVERSATION_MODAL_OPEN": {
      return { ...state, isLeaveDirectConversationModalOpen: action.payload };
    }
    case "AFTER_UNJOINED_ROOM": {
      return { ...state, rooms: action.payload, members: null, messages: null, chatScope: null };
    }
    case "SENT_MESSAGE": {
      return { ...state, messages: [...(state.messages || []), action.payload] };
    }
    case "RECEIVE_MESSAGE": {
      return {
        ...state,
        messages: [...(state.messages || []), action.payload],
      };
    }
    case "ENTERED_ROOM": {
      return {
        ...state,
        messages: action.payload.messages,
        members: sortPublicMembers(action.payload.members || [], true),
        chatScope: action.payload.chatScope,
        isEnteringRoom: false,
      };
    }
    // Sorts members
    case "AFTER_CONNECTION_ESTABLISHED": {
      const newState = {
        ...state,
        rooms: action.payload.rooms,
        directConversations: sortPublicDirectConversations(action.payload.directConversations, true),
      };
      if (action.payload.defaultRoom === undefined) {
        return newState;
      }
      newState.members = sortPublicMembers(action.payload.defaultRoom.members, true);
      newState.messages = action.payload.defaultRoom.messages;
      const { id, name } = action.payload.defaultRoom!.room;
      newState.chatScope = { id, type: "Room", scopeName: name };
      return newState;
    }
    case "SET_MEMBER_ACTIVE_STATUS": {
      const newState = { ...state };
      const memberIndex = state.members?.findIndex((m) => m.userId === action.payload.userId);
      const directConversationIndex = state.directConversations?.findIndex((dc) => dc.userId === action.payload.userId);
      if (memberIndex !== undefined && memberIndex !== -1) {
        newState.members = [...(state.members || [])];
        newState.members[memberIndex].isActive = action.payload.isActive;
        sortPublicMembers(newState.members, false);
      }
      if (directConversationIndex !== undefined && directConversationIndex !== -1) {
        newState.directConversations = [...(state.directConversations || [])];
        newState.directConversations[directConversationIndex].isActive = action.payload.isActive;
        sortPublicMembers(newState.directConversations, false);
      }
      return newState;
    }
    default: {
      return state;
    }
  }
}
