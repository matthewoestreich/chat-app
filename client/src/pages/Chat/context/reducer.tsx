import { ChatScope, PublicDirectConversation, PublicMessage, Room, PublicMember } from "@root/types.shared";
import sortMembers from "../sortMembers";

export interface ChatState {
  rooms: Room[] | null;
  directConversations: PublicDirectConversation[] | null;
  members: PublicMember[] | null;
  messages: PublicMessage[] | null;
  chatScope: ChatScope | null;
  isEnteringRoom: boolean;
  isJoinDirectConversationModalShown: boolean;
  isCreateRoomModalShown: boolean;
  isJoinRoomModalShown: boolean;
  isLeaveRoomModalShown: boolean;
  isDirectMessagesDrawerShown: boolean;
}

export type ChatStateAction =
  | { type: "AFTER_CONNECTION_ESTABLISHED"; payload: { rooms: Room[]; directConversations: PublicDirectConversation[] } }
  | { type: "SET_ROOMS"; payload: Room[] | null }
  | { type: "SET_MEMBERS"; payload: PublicMember[] | null }
  | { type: "SET_MESSAGES"; payload: PublicMessage[] | null }
  | { type: "SET_DIRECT_CONVERSATIONS"; payload: PublicDirectConversation[] | null }
  | {
      type: "JOINED_DIRECT_CONVERSATION";
      payload: { directConversations: PublicDirectConversation[]; scope: ChatScope; isDirectMessagesDrawerShown: boolean };
    }
  | { type: "SET_CHAT_SCOPE"; payload: ChatScope | null }
  | { type: "SET_IS_ENTERING_ROOM"; payload: boolean }
  | { type: "SENT_MESSAGE"; payload: PublicMessage }
  | { type: "AFTER_UNJOINED_ROOM"; payload: Room[] }
  | { type: "SET_MEMBER_ACTIVE_STATUS"; payload: { userId: string; isActive: boolean } }
  | { type: "ENTERED_ROOM"; payload: { messages: PublicMessage[] | null; members: PublicMember[] | null; chatScope: ChatScope | null } }
  | { type: "SET_IS_CREATE_ROOM_MODAL_SHOWN"; payload: boolean }
  | { type: "AFTER_MEMBER_CLICK"; payload: { chatScope: ChatScope; isDirectMessagesDrawerShown: boolean } }
  | { type: "SET_IS_JOIN_ROOM_MODAL_SHOWN"; payload: boolean }
  | { type: "SET_IS_LEAVE_ROOM_MODAL_SHOWN"; payload: boolean }
  | { type: "SET_IS_JOIN_DIRECT_CONVERSATION_MODAL_SHOWN"; payload: boolean }
  | { type: "SET_IS_DIRECT_MESSAGES_DRAWER_SHOWN"; payload: boolean };

export default function chatReducer(state: ChatState, action: ChatStateAction): ChatState {
  switch (action.type) {
    case "AFTER_CONNECTION_ESTABLISHED": {
      console.log("[ChatReducer]::afterConnectionEstablished", {
        rooms: action.payload.rooms,
        directConversations: action.payload.directConversations,
      });
      return { ...state, rooms: action.payload.rooms, directConversations: action.payload.directConversations };
    }
    case "SET_ROOMS": {
      console.log("[ChatReducer]::setAlreadyJoinedRooms");
      return { ...state, rooms: action.payload };
    }
    case "SET_MEMBERS": {
      console.log("[ChatReducer]::setMembers");
      return { ...state, members: action.payload };
    }
    case "SET_MESSAGES": {
      console.log("[ChatReducer]::setMessages");
      return { ...state, messages: action.payload };
    }
    case "SET_CHAT_SCOPE": {
      console.log("[ChatReducer]::setchatScope");
      return { ...state, chatScope: action.payload };
    }
    case "SET_DIRECT_CONVERSATIONS": {
      console.log("[ChatReducer]::setDirctConvos");
      if (!action.payload) {
        return state;
      }
      return { ...state, directConversations: sortMembers(action.payload, true) };
    }
    case "JOINED_DIRECT_CONVERSATION": {
      // TODO improve this logic
      console.log("[ChatReducer]::joinedDirectConversation");
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
        isDirectMessagesDrawerShown: action.payload.isDirectMessagesDrawerShown,
      };
      if (copy.length) {
        updatedState.members = copy;
      }
      return updatedState;
    }
    case "SET_IS_ENTERING_ROOM": {
      console.log("[ChatReducer]::isenteringroom");
      return { ...state, isEnteringRoom: action.payload };
    }
    case "SET_IS_JOIN_DIRECT_CONVERSATION_MODAL_SHOWN": {
      console.log("[ChatReducer]::setIsJoinDirectConvoModalOpen");
      return { ...state, isJoinDirectConversationModalShown: action.payload };
    }
    case "SET_IS_CREATE_ROOM_MODAL_SHOWN": {
      console.log("[ChatReducer]::setIsCreateRoomModalShown");
      return { ...state, isCreateRoomModalShown: action.payload };
    }
    case "SET_IS_JOIN_ROOM_MODAL_SHOWN": {
      console.log("[ChatReducer]::setIsJoinRoomModalShown");
      return { ...state, isJoinRoomModalShown: action.payload };
    }
    case "SET_IS_LEAVE_ROOM_MODAL_SHOWN": {
      console.log("[ChatReducer]::setIsLeaveRoomModalShown");
      return { ...state, isLeaveRoomModalShown: action.payload };
    }
    case "SET_IS_DIRECT_MESSAGES_DRAWER_SHOWN": {
      console.log("[ChatReducer]::setIsDirectMessagesDrawerShown");
      return { ...state, isDirectMessagesDrawerShown: action.payload };
    }
    case "AFTER_UNJOINED_ROOM": {
      console.log("[ChatReducer]::afterUnjoinedRoom");
      return { ...state, rooms: action.payload, members: null, messages: null, chatScope: null };
    }
    case "AFTER_MEMBER_CLICK": {
      console.log("[ChatReducer]::afterMemberClick");
      return { ...state, chatScope: action.payload.chatScope, isDirectMessagesDrawerShown: action.payload.isDirectMessagesDrawerShown };
    }
    case "SET_MEMBER_ACTIVE_STATUS": {
      console.log("[ChatReducer]::setmemberactiveStatus");
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
      console.log("[ChatReducer]::sentMessage");
      return {
        ...state,
        messages: [...(state.messages ?? []), action.payload],
      };
    }
    case "ENTERED_ROOM": {
      console.log("[ChatReducer]::enteredRoom");
      return {
        ...state,
        messages: action.payload.messages,
        members: action.payload.members,
        chatScope: action.payload.chatScope,
        isEnteringRoom: false,
      };
    }
    default: {
      console.log("[ChatReducer]::default");
      return state;
    }
  }
}
