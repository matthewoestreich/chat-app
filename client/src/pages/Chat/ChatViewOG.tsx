import React, { memo, useCallback, useMemo, useRef /*useState*/ } from "react";
import { Message, Room /*Member,*/ /*LoadingSpinner*/ } from "@components";
import { useAuth, useChat, useRenderCounter } from "@hooks";
import { SingletonWebSocketeer as websocketeer } from "@client/ws";
import Topbar from "../Topbar";
//import LeaveRoomModal from "./LeaveRoomModal";
//import JoinRoomModal from "./JoinRoomModal";
//import CreateRoomModal from "./CreateRoomModal";
//import DirectMessagesDrawer from "./DirectMessagesDrawer";
import sortMembers from "./sortMembers";

const RoomMemo = memo(Room);
const MessageMemo = memo(Message);
//const MemberMemo = memo(Member);
//const LeaveRoomModalMemo = memo(LeaveRoomModal);
//const JoinRoomModalMemo = memo(JoinRoomModal);
//const CreateRoomModalMemo = memo(CreateRoomModal);
//const DirectMessagesDrawerMemo = memo(DirectMessagesDrawer);
//const LoadingSpinnerMemo = memo(LoadingSpinner);
const TopbarMemo = memo(Topbar);

export default function ChatView(): React.JSX.Element {
  const renderCount = useRenderCounter(`ChatPage`);
  console.log(renderCount);

  //const [isLeaveRoomModalShown, setIsLeaveRoomModalShown] = useState(false);
  //const [isCreateRoomModalShown, setIsCreateRoomModalShown] = useState(false);
  //const [isJoinRoomModalShown, setIsJoinRoomModalShown] = useState(false);
  //const [isDirectMessagesShown, setIsDirectMessagesShown] = useState(false);

  const messageText = useRef<HTMLTextAreaElement | null>(null);
  //const chatDisplayRef = useRef<HTMLDivElement>(null);

  const { state: ogState, dispatch: ogDispatch } = useChat();
  const { state, dispatch } = useMemo(() => ({ state: ogState, dispatch: ogDispatch }), [ogDispatch, ogState]);
  const { user } = useAuth();

  // Scroll to bottom of chat display when we send/receive a message
  //useEffect(() => {
  //  console.log(`useEffect that triggers on state.messages or state.directMessages`)
  //  const messagesExist = state.messages && state.messages.length > 0;
  //  const directMessagesExist = state.directMessages && state.directMessages.length > 0;
  //  if (chatDisplayRef.current && (messagesExist || directMessagesExist)) {
  //    chatDisplayRef.current.scrollTop = chatDisplayRef.current.scrollHeight;
  //  }
  //}, [state.messages, state.directMessages]);

  websocketeer.on("SENT_MESSAGE", ({ error, message }) => {
    if (error) {
      return console.error(error);
    }
    dispatch({ type: "SENT_MESSAGE", payload: message });
  });

  websocketeer.on("ENTERED_ROOM", ({ /*members,*/ messages, /*room,*/ error }) => {
    if (error) {
      return console.error(error);
    }
    // Sorts in place
    //sortMembers(members);
    //const scope: ChatScope = { type: "Room", conversationId: room.id, userId: room.id, name: room.name };
    dispatch({ type: "ENTERED_ROOM", payload: { /*members,*/ members: null, messages, chatScope: null } });
  });

  websocketeer.on("MEMBER_ENTERED_ROOM", ({ id, error }) => {
    if (error) {
      return console.error(error);
    }
    console.log("from websocketeer handler, member entered room");
    dispatch({ type: "SET_MEMBER_ACTIVE_STATUS", payload: { userId: id, isActive: true } });
  });

  /*
  websocketeer.on("MEMBER_LEFT_ROOM", ({ id, error }) => {
    if (error) {
      return console.error(error);
    }
    dispatch({ type: "SET_MEMBER_ACTIVE_STATUS", payload: { userId: id, isActive: false } });
  });
  */

  /*
  websocketeer.on("LIST_DIRECT_CONVERSATIONS", ({ directConversations, error }) => {
    if (error) {
      return console.error("ChatView::LIST_DIRECT_CONVERSATIONS", error);
    }
    dispatch({ type: "SET_DIRECT_CONVERSATIONS", payload: directConversations });
  });
  */

  /*
  websocketeer.on("LIST_DIRECT_MESSAGES", ({ directMessages, error }) => {
    if (error) {
      return console.error(error);
    }
    dispatch({ type: "SET_DIRECT_MESSAGES", payload: directMessages });
  });

  websocketeer.on("JOINED_ROOM", ({ rooms, error }) => {
    if (error) {
      return console.error(error);
    }
    dispatch({ type: "SET_ROOMS", payload: rooms });
  });

  websocketeer.on("UNJOINED_ROOM", ({ rooms, error }) => {
    if (error) {
      return console.error(error);
    }
    dispatch({ type: "SET_ROOMS", payload: rooms });
  });

  websocketeer.on("CREATED_ROOM", ({ rooms, error }) => {
    if (error) {
      return console.error(error);
    }
    dispatch({ type: "SET_ROOMS", payload: rooms });
  });
  */

  //websocketeer.on("JOINED_DIRECT_CONVERSATION", ({ error }) => {
  //  if (error) {
  //    return console.error(error);
  //  }
  //  handleOpenDirectMessagesDrawer();
  //});

  //function handleOpenJoinRoomModal(): void {
  //  setIsJoinRoomModalShown(true);
  //}

  //function handleOpenLeaveRoomModal(): void {
  //  setIsLeaveRoomModalShown(true);
  //}

  //function handleOpenCreateRoomModal(): void {
  //  setIsCreateRoomModalShown(true);
  // }

  //function handleMessageInputKeyDown(e: KeyboardEvent<HTMLTextAreaElement>): void {
  //  if (e.key === "Enter") {
  //    e.preventDefault();
  //    e.stopPropagation();
  //    if (messageText.current === "" || !state.chatScope) {
  //      return;
  //    }
  //    console.log("sending message via enter");
  //    websocketeer.send("SEND_MESSAGE", { message: messageText.current, scope: state.chatScope });
  //  }
  //}

  const handleSendMessage = useCallback(() => {
    console.log(messageText);
    //if (messageText.current === null || messageText.current.value === "" || !state.chatScope) {
    //  return;
    //}
    console.log("sending message via click");
    websocketeer.send("SEND_MESSAGE", { message: messageText.current?.value || "na" });
  }, [messageText /*state.chatScope*/]);

  //function handleOpenDirectMessagesDrawer(): void {
  //  setIsDirectMessagesShown(true);
  //}

  //const handleCloseDirectMessagesDrawer = useCallback(() => {
  //  setIsDirectMessagesShown(false);
  //}, []);

  //const handleCloseCreateRoomModal = useCallback(() => {
  //  setIsCreateRoomModalShown(false);
  //}, []);

  //const handleCloseJoinRoomModal = useCallback(() => {
  //  setIsJoinRoomModalShown(false);
  //}, []);

  //const handleCloseLeaveRoomModal = useCallback(() => {
  //  setIsLeaveRoomModalShown(false);
  //}, []);

  /**
   * Members specific methods
   */

  // prettier-ignore
  /*
  const handleMemberClick = useCallback((userId: string) => {
    console.log(`handling member click`, userId);
    // Check if already in direct convo with userId
    console.log({dcs:state.directConversations});
    const directConvo = state.directConversations?.find((dc) => dc.userId === userId);
    if (!directConvo) {
      console.log(`no direct convo with user '${userId}' was found, sending "JOIN_DIRECT_CONVERSATION"`);
      return websocketeer.send("JOIN_DIRECT_CONVERSATION", { withUserId: userId });
    }
    console.log(`Already in direct convo user '${userId}', updating state and opening drawer`);
    // Already in direct convo with this person. Update chatScope and open the direct convo drawer and select the convo.
    const chatScope: ChatScope = { conversationId: directConvo.id, userId: directConvo.userId, name: directConvo.userName, type: "DirectConversation" };
    dispatch({ type: "SET_CHAT_SCOPE", payload: chatScope });
    handleOpenDirectMessagesDrawer();
  }, [state.directConversations, dispatch]);
  */

  // If we don't cache click handlers, we get unnecessary re-renders due to the onClick func being recreated when parent renders.
  /*
  const memberClickHandlers = useMemo(() => {
    return new Map(state.members?.map((member) => [member.userId, (): void => handleMemberClick(member.userId)]));
  }, [state.members, handleMemberClick]);
  */

  /*
  const renderMembers = useCallback(() => {
    if (state.isEnteringRoom) {
      return <LoadingSpinnerMemo />;
    }
    return state.members?.map((member) => {
      console.log(`looping thru members ${member.name}`);
      return (
        <MemberMemo
          isButton={true}
          onClick={memberClickHandlers.get(member.userId)}
          memberId={member.userId}
          key={member.userId}
          memberName={member.name}
          isOnline={member.isActive}
        />
      )
    });
  }, [state.members, state.isEnteringRoom, memberClickHandlers]);
  */

  /**
   * Rooms specific methods
   */

  const handleRoomClick = useCallback(
    (roomId: string) => {
      //dispatch({ type: "SET_IS_ENTERING_ROOM", payload: true });
      console.log("clicked room, entering room");
      websocketeer.send("ENTER_ROOM", { id: roomId });
    },
    [/*dispatch*/],
  );

  // If we don't cache click handlers, rooms rerender a lot due to `onClick` being recreated.
  const roomClickHandlers = useMemo(() => {
    return new Map(state.rooms?.map((room) => [room.id, (): void => handleRoomClick(room.id)]));
  }, [state.rooms, handleRoomClick]);

  const renderRooms = useCallback(() => {
    console.log(`render rooms fired`);
    return state.rooms?.map((room) => (
      <RoomMemo
        key={room.id}
        roomId={room.id}
        roomName={room.name}
        onClick={roomClickHandlers.get(room.id)}
        //isSelected={state.chatScope?.conversationId === room.id}
      />
    ));
  }, [state.rooms, roomClickHandlers]);

  /**
   * Chat messages specific methods
   */

  return (
    <>
      {/*<LeaveRoomModalMemo isOpen={isLeaveRoomModalShown} onClose={handleCloseLeaveRoomModal} selectedRoom={state.chatScope} />
      <CreateRoomModalMemo isOpen={isCreateRoomModalShown} onClose={handleCloseCreateRoomModal} />
      <JoinRoomModalMemo isOpen={isJoinRoomModalShown} onClose={handleCloseJoinRoomModal} />*/}
      <TopbarMemo />
      <div className="container-fluid h-100 d-flex flex-column" style={{ paddingTop: "4em" }}>
        <div className="row text-center">
          <div className="col">
            <h1>{user?.name}</h1>
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
              {/*<ul className="list-group list-group-flush">{renderMembers()}</ul>
              <DirectMessagesDrawerMemo isShown={isDirectMessagesShown} onClose={handleCloseDirectMessagesDrawer} />*/}
            </div>
            <div className="card-footer">
              <div className="row">
                <div className="col-12 d-flex p-1">
                  <button
                    //onClick={handleOpenDirectMessagesDrawer}
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
                {state.chatScope !== null && state.chatScope.name}
              </div>
            </div>
            <div /*ref={chatDisplayRef}*/ className="card-body overf-y-scroll">
              {/*state.isEnteringRoom ? (
                <LoadingSpinnerMemo />
              ) : state.chatScope?.type === "Room" ? (
                state.messages?.map((message) => {
                  console.log(`loop thru message ${message.messageId}`);
                  return (
                    <MessageMemo messageId={message.messageId} key={message.messageId} message={message.message} from={message.userName || "-"} />
                  );
                })
              ) : (
                state.chatScope?.type === "DirectConversation" &&
                state.directMessages?.map((message) => {
                  console.log(`looping thru dir msg ${message.id}`);
                  return <MessageMemo messageId={message.id} key={message.id} message={message.message} from={message.fromUserName || "-"} />;
                })
              )*/ state.messages?.map((msg) => (
                <MessageMemo messageId={msg.messageId} key={msg.messageId} message={msg.message} from={msg.userName || "-"} />
              ))}
            </div>
            <div className="card-footer">
              <div className="input-group">
                <textarea ref={messageText} className="form-control custom-control" rows={3} style={{ resize: "none" }}></textarea>
                <button onClick={handleSendMessage} className="input-group-addon btn btn-lg btn-primary">
                  Send
                </button>
              </div>
            </div>
          </div>
          <div
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
                    //onClick={handleOpenJoinRoomModal}
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
                    //onClick={handleOpenLeaveRoomModal}
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
                  <button /*onClick={handleOpenCreateRoomModal}*/ className="btn btn-primary shadow flex-grow-1" type="button" title="Create Room">
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
