import React, { KeyboardEvent, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WebSocketeerEventPayload } from "@client/types";
import { ChatScope } from "@root/types.shared";
import closeOffcanvasAtOrBelowBreakpoint from "@src/closeOffcanvasAtOrBelowBreakpoint";
import { Message, Room, Member, LoadingSpinner } from "@components";
import { useAuth, useChat, useEffectOnce, useRenderCounter } from "@hooks";
import { SingletonWebSocketeer as websocketeer, WebSocketEvents } from "@src/ws";
import Topbar from "../Topbar";
import LeaveRoomModal from "./LeaveRoomModal";
import JoinRoomModal from "./JoinRoomModal";
import CreateRoomModal from "./CreateRoomModal";
import JoinDirectConversationModal from "./JoinDirectConversationModal";
import DirectMessagesDrawer from "./DirectMessagesDrawer";
import sortMembers from "./sortMembers";

const RoomMemo = memo(Room);
const MessageMemo = memo(Message);
const MemberMemo = memo(Member);
const CreateRoomModalMemo = memo(CreateRoomModal);
const JoinDirectConversationModalMemo = memo(JoinDirectConversationModal);
const LeaveRoomModalMemo = memo(LeaveRoomModal);
const JoinRoomModalMemo = memo(JoinRoomModal);
const DirectMessagesDrawerMemo = memo(DirectMessagesDrawer);
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

  const [isLeaveRoomModalShown, setIsLeaveRoomModalShown] = useState(false);
  const [isCreateRoomModalShown, setIsCreateRoomModalShown] = useState(false);
  const [isJoinRoomModalShown, setIsJoinRoomModalShown] = useState(false);
  const [isDirectMessagesShown, setIsDirectMessagesShown] = useState(false);

  const chatDisplayRef = useRef<HTMLDivElement>(null);
  const chatMessageInputRef = useRef<HTMLTextAreaElement | null>(null);
  const offcanvasRoomsRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom of chat display when we send/receive a message
  useEffect(() => {
    if (chatDisplayRef.current && state.messages && state.messages.length > 0) {
      chatDisplayRef.current.scrollTop = chatDisplayRef.current.scrollHeight;
    }
  }, [state.messages]);

  useEffectOnce(() => {
    const handleSentMessage: (payload: WebSocketeerEventPayload<WebSocketEvents, "SENT_MESSAGE">) => void = ({ message, error }) => {
      if (error) {
        return console.error(error);
      }
      dispatch({ type: "SENT_MESSAGE", payload: message });
      if (chatMessageInputRef && chatMessageInputRef.current) {
        chatMessageInputRef.current.value = "";
      }
    };

    const handleEnteredRoom: (payload: WebSocketeerEventPayload<WebSocketEvents, "ENTERED_ROOM">) => void = ({ members, messages, room, error }) => {
      if (error) {
        return console.error(error);
      }
      sortMembers(members, false);
      const scope: ChatScope = { type: "Room", userId: user!.id, id: room.id, userName: user!.userName, scopeName: room.name };
      dispatch({ type: "ENTERED_ROOM", payload: { members, messages, chatScope: scope } });
    };

    const handleMemberEnteredRoom: (payload: WebSocketeerEventPayload<WebSocketEvents, "MEMBER_ENTERED_ROOM">) => void = ({ id, error }) => {
      if (error) {
        return console.error(error);
      }
      dispatch({ type: "SET_MEMBER_ACTIVE_STATUS", payload: { userId: id, isActive: true } });
    };

    const handleMemberLeftRoom: (payload: WebSocketeerEventPayload<WebSocketEvents, "MEMBER_LEFT_ROOM">) => void = ({ id, error }) => {
      if (error) {
        return console.error(error);
      }
      dispatch({ type: "SET_MEMBER_ACTIVE_STATUS", payload: { userId: id, isActive: false } });
    };

    const handleListRooms: (payload: WebSocketeerEventPayload<WebSocketEvents, "LIST_ROOMS">) => void = ({ rooms, error }) => {
      if (error) {
        return console.error(error);
      }
      dispatch({ type: "SET_ROOMS", payload: rooms });
    };

    const handleJoinedRoom: (payload: WebSocketeerEventPayload<WebSocketEvents, "JOINED_ROOM">) => void = ({ rooms, error }) => {
      if (error) {
        return console.error(error);
      }
      dispatch({ type: "SET_ROOMS", payload: rooms });
    };

    const handleUnjoinedRoom: (payload: WebSocketeerEventPayload<WebSocketEvents, "UNJOINED_ROOM">) => void = ({ rooms, error }) => {
      if (error) {
        return console.error(error);
      }
      dispatch({ type: "SET_ROOMS", payload: rooms });
    };

    const handleCreatedRoom: (payload: WebSocketeerEventPayload<WebSocketEvents, "CREATED_ROOM">) => void = ({ rooms, error }) => {
      if (error) {
        return console.error(error);
      }
      dispatch({ type: "SET_ROOMS", payload: rooms });
    };

    const handleUserDisconnected: (payload: WebSocketeerEventPayload<WebSocketEvents, "USER_DISCONNECTED">) => void = ({ userId }) => {
      dispatch({ type: "SET_MEMBER_ACTIVE_STATUS", payload: { userId, isActive: false } });
    };

    websocketeer.on("SENT_MESSAGE", handleSentMessage);
    websocketeer.on("ENTERED_ROOM", handleEnteredRoom);
    websocketeer.on("MEMBER_ENTERED_ROOM", handleMemberEnteredRoom);
    websocketeer.on("MEMBER_LEFT_ROOM", handleMemberLeftRoom);
    websocketeer.on("LIST_ROOMS", handleListRooms);
    websocketeer.on("JOINED_ROOM", handleJoinedRoom);
    websocketeer.on("UNJOINED_ROOM", handleUnjoinedRoom);
    websocketeer.on("CREATED_ROOM", handleCreatedRoom);
    websocketeer.on("USER_DISCONNECTED", handleUserDisconnected);

    return (): void => {
      console.log(`[ChatView]::useEffect : tearing down`);
      websocketeer.off("SENT_MESSAGE", handleSentMessage);
      websocketeer.off("ENTERED_ROOM", handleEnteredRoom);
      websocketeer.off("MEMBER_ENTERED_ROOM", handleMemberEnteredRoom);
      websocketeer.off("MEMBER_LEFT_ROOM", handleMemberLeftRoom);
      websocketeer.off("LIST_ROOMS", handleListRooms);
      websocketeer.off("JOINED_ROOM", handleJoinedRoom);
      websocketeer.off("UNJOINED_ROOM", handleUnjoinedRoom);
      websocketeer.off("CREATED_ROOM", handleCreatedRoom);
      websocketeer.off("USER_DISCONNECTED", handleUserDisconnected);
    };
  });

  function handleOpenJoinRoomModal(): void {
    setIsJoinRoomModalShown(true);
  }

  function handleOpenLeaveRoomModal(): void {
    setIsLeaveRoomModalShown(true);
  }

  function handleOpenCreateRoomModal(): void {
    setIsCreateRoomModalShown(true);
  }

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

  const handleOpenDirectMessagesDrawer = useCallback(() => {
    setIsDirectMessagesShown(true);
  }, []);

  const handleCloseDirectMessagesDrawer = useCallback(() => {
    setIsDirectMessagesShown(false);
  }, []);

  const handleCloseCreateRoomModal = useCallback(() => {
    setIsCreateRoomModalShown(false);
  }, []);

  const handleCloseJoinRoomModal = useCallback(() => {
    setIsJoinRoomModalShown(false);
  }, []);

  const handleCloseLeaveRoomModal = useCallback(() => {
    setIsLeaveRoomModalShown(false);
  }, []);

  const handleCloseDirectConversationModal = useCallback(() => {
    dispatch({ type: "SET_IS_JOIN_DIRECT_CONVERSATION_MODAL_OPEN", payload: false });
  }, [dispatch]);

  const renderMessages = useCallback(() => {
    console.log("[ChatView] in 'renderMessages' (this does not mean messages ae rendering)");
    if (state.isEnteringRoom) {
      return <LoadingSpinnerMemo />;
    }
    return state.messages?.map((message) => {
      return <MessageMemo messageId={message.id} key={message.id} message={message.message} from={message.userName || "-"} />;
    });
  }, [state.messages, state.isEnteringRoom]);

  const renderMembers = useCallback(() => {
    console.log("[ChatView] in 'renderMembers' (this does not mean members ae rendering)");
    return state.members?.map((member) => (
      <MemberMemo memberId={member.userId} key={member.userId} memberName={member.userName} isOnline={member.isActive} />
    ));
  }, [state.members]);

  // prettier-ignore
  const handleRoomClick = useCallback((roomId: string) => {
    // No need to update ChatScope here. We only want to do that AFTER we entered the room.
    dispatch({ type: "SET_IS_ENTERING_ROOM", payload: true });
    websocketeer.send("ENTER_ROOM", { id: roomId });
    closeOffcanvasAtOrBelowBreakpoint(offcanvasRoomsRef, "md");
  }, [dispatch]);

  // If we don't cache click handlers, rooms rerender a lot due to `onClick` being recreated.
  const roomClickHandlers = useMemo(() => {
    return new Map(state.rooms?.map((room) => [room.id, (): void => handleRoomClick(room.id)]));
  }, [state.rooms, handleRoomClick]);

  const renderRooms = useCallback(() => {
    console.log("[ChatView] in 'renderRooms' (this does not mean rooms ae rendering)");
    return state.rooms?.map((room) => (
      <RoomMemo
        key={room.id}
        roomId={room.id}
        roomName={room.name}
        onClick={roomClickHandlers.get(room.id)}
        isSelected={state.chatScope?.id === room.id}
      />
    ));
  }, [state.rooms, state.chatScope?.id, roomClickHandlers]);

  return (
    <>
      <LeaveRoomModalMemo isOpen={isLeaveRoomModalShown} onClose={handleCloseLeaveRoomModal} selectedRoom={state.chatScope} />
      <CreateRoomModalMemo isOpen={isCreateRoomModalShown} onClose={handleCloseCreateRoomModal} />
      <JoinRoomModalMemo isOpen={isJoinRoomModalShown} onClose={handleCloseJoinRoomModal} />
      <JoinDirectConversationModalMemo isOpen={state.isJoinDirectConversationModalOpen} onClose={handleCloseDirectConversationModal} />
      <TopbarMemo />
      <div className="container-fluid h-100 d-flex flex-column" style={{ paddingTop: "4em" }}>
        <div className="row text-center">
          <div className="col">
            <h1>{user?.userName}</h1>
          </div>
        </div>
        <div className="row g-0 flex-fill justify-content-center min-h-0">
          <div
            id="members-offcanvas"
            className="card col-xl-3 col-xxl-2 col-3 d-lg-flex flex-column h-lg-90pct min-h-0 overf-hide offcanvas-lg offcanvas-start"
          >
            <div className="card-header d-flex flex-row display-6 text-center">
              <div className="flex-fill text-center">Members</div>
              <button
                className="btn btn-close btn-sm d-lg-none ms-auto"
                type="button"
                data-bs-dismiss="offcanvas"
                data-bs-target="#members-offcanvas"
              ></button>
            </div>
            <div id="members-container" className="card-body overf-y-scroll p-0 m-1">
              <ul className="list-group list-group-flush">{renderMembers()}</ul>
              <DirectMessagesDrawerMemo isShown={isDirectMessagesShown} onClose={handleCloseDirectMessagesDrawer} />
            </div>
            <div className="card-footer">
              <div className="row">
                <div className="col-12 d-flex p-1">
                  <button
                    onClick={handleOpenDirectMessagesDrawer}
                    className="btn btn-primary flex-grow-1 shadow"
                    type="button"
                    title="Direct Messages"
                  >
                    <i className="bi bi-chat-dots-fill"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
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
          <div
            ref={offcanvasRoomsRef}
            id="rooms-offcanvas"
            className="card col-xl-3 col-xxl-2 col-3 d-lg-flex flex-column h-lg-90pct min-h-0 overf-hide offcanvas-lg offcanvas-end"
          >
            <div className="card-header d-flex flex-row display-6 text-center">
              <div className="flex-fill text-center">Rooms</div>
              <button
                className="btn btn-close btn-sm d-lg-none ms-auto shadow"
                type="button"
                data-bs-dismiss="offcanvas"
                data-bs-target="#rooms-offcanvas"
              ></button>
            </div>
            <ul id="rooms-container" className="card-body overf-y-scroll p-0 m-1">
              {renderRooms()}
            </ul>
            <div className="card-footer">
              <div className="row">
                <div className="col-4 d-flex p-1">
                  <button
                    onClick={handleOpenJoinRoomModal}
                    id="open-join-room-modal"
                    className="btn btn-primary shadow flex-grow-1"
                    type="button"
                    title="Join Room"
                  >
                    <i className="bi bi-box-arrow-in-up-right"></i>
                  </button>
                </div>
                <div className="col-4 d-flex p-1">
                  <button
                    onClick={handleOpenLeaveRoomModal}
                    id="open-leave-room-modal"
                    className="btn btn-warning shadow flex-grow-1"
                    type="button"
                    title="Leave Current Room"
                    disabled={state.chatScope === null}
                  >
                    <i className="bi bi-box-arrow-down-left"></i>
                  </button>
                </div>
                <div className="col-4 d-flex p-1">
                  <button onClick={handleOpenCreateRoomModal} className="btn btn-primary shadow flex-grow-1" type="button" title="Create Room">
                    <i className="bi bi-folder-plus"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
