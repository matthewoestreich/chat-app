import React, { KeyboardEvent, memo, useCallback, useEffect, useRef } from "react";
import { WebSocketeerEventHandler } from "@client/types";
import { Message, LoadingSpinner } from "@components";
import { useAuth, useChat, useEffectOnce, useRenderCounter } from "@hooks";
import { websocketeer, WebSocketEvents } from "@src/ws";
import Topbar from "../Topbar";
import LeaveRoomModal from "./LeaveRoomModal";
import JoinRoomModal from "./JoinRoomModal";
import CreateRoomModal from "./CreateRoomModal";
import JoinDirectConversationModal from "./JoinDirectConversationModal";
import { RoomsSection, MembersSection } from "./sections";

const RoomsSectionMemo = memo(RoomsSection);
const MembersSectionMemo = memo(MembersSection);
const MessageMemo = memo(Message);
const CreateRoomModalMemo = memo(CreateRoomModal);
const JoinDirectConversationModalMemo = memo(JoinDirectConversationModal);
const LeaveRoomModalMemo = memo(LeaveRoomModal);
const JoinRoomModalMemo = memo(JoinRoomModal);
const LoadingSpinnerMemo = memo(LoadingSpinner);
const TopbarMemo = memo(Topbar);

/**
 *
 * ChatView is conditionally rendered via ChatPage (which is the entry point for the /chat route)
 * ChatView is the 'workhorse' for our `/chat` route. It does a lot of the heavy lifting.
 *
 */
export default function ChatView(): React.JSX.Element {
  const renderCount = useRenderCounter(`ChatPage`);
  console.log(renderCount);

  const { state, dispatch } = useChat();
  const { user } = useAuth();

  const chatDisplayRef = useRef<HTMLDivElement>(null);
  const chatMessageInputRef = useRef<HTMLTextAreaElement | null>(null);

  // Scroll to bottom of chat display when we send/receive a message
  useEffect(() => {
    if (chatDisplayRef.current && state.messages && state.messages.length > 0) {
      chatDisplayRef.current.scrollTop = chatDisplayRef.current.scrollHeight;
    }
  }, [state.messages]);

  useEffectOnce(() => {
    const handleSentMessage: WebSocketeerEventHandler<WebSocketEvents, "SENT_MESSAGE"> = ({ message, error }) => {
      if (error) {
        return console.error(error);
      }
      dispatch({ type: "SENT_MESSAGE", payload: message });
      if (chatMessageInputRef && chatMessageInputRef.current) {
        chatMessageInputRef.current.value = "";
      }
    };

    const handleMemberEnteredRoom: WebSocketeerEventHandler<WebSocketEvents, "MEMBER_ENTERED_ROOM"> = ({ id, error }) => {
      if (error) {
        return console.error(error);
      }
      dispatch({ type: "SET_MEMBER_ACTIVE_STATUS", payload: { userId: id, isActive: true } });
    };

    const handleMemberLeftRoom: WebSocketeerEventHandler<WebSocketEvents, "MEMBER_LEFT_ROOM"> = ({ id, error }) => {
      if (error) {
        return console.error(error);
      }
      dispatch({ type: "SET_MEMBER_ACTIVE_STATUS", payload: { userId: id, isActive: false } });
    };

    const handleUserDisconnected: WebSocketeerEventHandler<WebSocketEvents, "USER_DISCONNECTED"> = ({ userId }) => {
      dispatch({ type: "SET_MEMBER_ACTIVE_STATUS", payload: { userId, isActive: false } });
    };

    const handleUserConnected: WebSocketeerEventHandler<WebSocketEvents, "USER_CONNECTED"> = ({ userId }) => {
      dispatch({ type: "SET_MEMBER_ACTIVE_STATUS", payload: { userId, isActive: true } });
    };

    const handleDirectMessages: WebSocketeerEventHandler<WebSocketEvents, "LIST_DIRECT_MESSAGES"> = ({ directMessages, error }) => {
      if (error) {
        return console.error(error);
      }
      dispatch({ type: "SET_MESSAGES", payload: directMessages });
    };

    websocketeer.on("SENT_MESSAGE", handleSentMessage);
    websocketeer.on("MEMBER_ENTERED_ROOM", handleMemberEnteredRoom);
    websocketeer.on("MEMBER_LEFT_ROOM", handleMemberLeftRoom);
    websocketeer.on("USER_DISCONNECTED", handleUserDisconnected);
    websocketeer.on("USER_CONNECTED", handleUserConnected);
    websocketeer.on("LIST_DIRECT_MESSAGES", handleDirectMessages);

    return (): void => {
      console.log(`[ChatView]::useEffect : tearing down`);
      websocketeer.off("SENT_MESSAGE", handleSentMessage);
      websocketeer.off("MEMBER_ENTERED_ROOM", handleMemberEnteredRoom);
      websocketeer.off("MEMBER_LEFT_ROOM", handleMemberLeftRoom);
      websocketeer.off("USER_DISCONNECTED", handleUserDisconnected);
      websocketeer.off("USER_CONNECTED", handleUserConnected);
      websocketeer.off("LIST_DIRECT_MESSAGES", handleDirectMessages);
    };
  });

  // prettier-ignore
  const handleMessageInputKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      if (chatMessageInputRef.current === null || chatMessageInputRef.current.value === "" || !state.chatScope) {
        return;
      }
      websocketeer.send("SEND_MESSAGE", { message: chatMessageInputRef.current.value, scope: state.chatScope });
    }
  }, [state.chatScope, chatMessageInputRef]);

  function handleSendMessage(): void {
    if (chatMessageInputRef.current === null || chatMessageInputRef.current.value === "" || !state.chatScope) {
      return;
    }
    console.log({ chatScope: state.chatScope });
    websocketeer.send("SEND_MESSAGE", { message: chatMessageInputRef.current.value, scope: state.chatScope });
  }

  const handleLogout = useCallback(() => {
    websocketeer.send("CONNECTION_LOGOUT");
  }, []);

  const handleCloseCreateRoomModal = useCallback(() => {
    dispatch({ type: "SET_IS_CREATE_ROOM_MODAL_SHOWN", payload: false });
  }, [dispatch]);

  const handleCloseJoinRoomModal = useCallback(() => {
    dispatch({ type: "SET_IS_JOIN_ROOM_MODAL_SHOWN", payload: false });
  }, [dispatch]);

  const handleCloseLeaveRoomModal = useCallback(() => {
    dispatch({ type: "SET_IS_LEAVE_ROOM_MODAL_SHOWN", payload: false });
  }, [dispatch]);

  const handleCloseDirectConversationModal = useCallback(() => {
    dispatch({ type: "SET_IS_JOIN_DIRECT_CONVERSATION_MODAL_SHOWN", payload: false });
  }, [dispatch]);

  /**
   * Messages render function
   */
  const renderMessages = useCallback(() => {
    console.log("[ChatView] in 'renderMessages' (this does not mean messages ae rendering)");
    if (state.isEnteringRoom) {
      return <LoadingSpinnerMemo />;
    }
    return state.messages?.map((message) => {
      return <MessageMemo messageId={message.id} key={message.id} message={message.message} from={message.userName || "-"} />;
    });
  }, [state.messages, state.isEnteringRoom]);

  return (
    <>
      <LeaveRoomModalMemo isOpen={state.isLeaveRoomModalShown} onClose={handleCloseLeaveRoomModal} selectedRoom={state.chatScope} />
      <CreateRoomModalMemo isOpen={state.isCreateRoomModalShown} onClose={handleCloseCreateRoomModal} />
      <JoinRoomModalMemo isOpen={state.isJoinRoomModalShown} onClose={handleCloseJoinRoomModal} />
      <JoinDirectConversationModalMemo isOpen={state.isJoinDirectConversationModalShown} onClose={handleCloseDirectConversationModal} />
      <TopbarMemo onLogout={handleLogout} />
      <div className="container-fluid h-100 d-flex flex-column" style={{ paddingTop: "4em" }}>
        <div className="row text-center">
          <div className="col">
            <h1>{user?.userName}</h1>
          </div>
        </div>
        <div className="row g-0 flex-fill justify-content-center min-h-0">
          <MembersSectionMemo />
          <div className="card col-lg-6 offset-lg-0 col-md-12 offset-md-0 h-90pct overf-hide d-flex">
            <div className="card-header d-flex flex-row">
              <div className="d-flex w-100 text-center justify-content-center align-items-center chat-title chat-title-no-room">
                {state.chatScope !== null && state.chatScope.scopeName}
              </div>
            </div>
            <div ref={chatDisplayRef} className="card-body overf-y-scroll">
              {renderMessages()}
            </div>
            <div className="card-footer">
              <div className="input-group">
                <textarea
                  ref={chatMessageInputRef}
                  onKeyDown={handleMessageInputKeyDown}
                  className="form-control custom-control"
                  rows={3}
                  style={{ resize: "none" }}
                ></textarea>
                <button onClick={handleSendMessage} className="input-group-addon btn btn-lg btn-primary">
                  Send
                </button>
              </div>
            </div>
          </div>
          <RoomsSectionMemo />
        </div>
      </div>
    </>
  );
}
