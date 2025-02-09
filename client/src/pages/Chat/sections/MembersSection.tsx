import React, { memo, useCallback, useMemo } from "react";
import { Member } from "@components";
import { useChat } from "@hooks";
import { ChatScope, PublicMember } from "@root/types.shared";
import { websocketeer } from "@client/src/ws";
import DirectMessagesDrawer from "../DirectMessagesDrawer";

const MemberMemo = memo(Member);
const DirectMessagesDrawerMemo = memo(DirectMessagesDrawer);

export default function MembersSection(): React.JSX.Element {
  const { state, dispatch } = useChat();

  const handleOpenDirectMessagesDrawer = useCallback(() => {
    dispatch({ type: "SET_IS_DIRECT_MESSAGES_DRAWER_SHOWN", payload: true });
  }, [dispatch]);

  const handleCloseDirectMessagesDrawer = useCallback(() => {
    dispatch({ type: "SET_IS_DIRECT_MESSAGES_DRAWER_SHOWN", payload: false });
  }, [dispatch]);

  /**
   * Member click handler
   */
  // prettier-ignore
  const handleMemberClick = useCallback(({ scopeId, userId, userName }: PublicMember) => {
    if (!state.directConversations) {
      return websocketeer.send("JOIN_DIRECT_CONVERSATION", { withUserId: userId });
    }

    // See if we are already in a direct convo with this member.
    const convoIndex = state.directConversations?.findIndex((dc) => dc.userId === userId);
    if (convoIndex === -1) {
      // It's a new direct convo
      return websocketeer.send("JOIN_DIRECT_CONVERSATION", { withUserId: userId });
    }

    // It's an existing convo.
    // Since a direct convo doesn't have a name (like how a room has a name) just use the other persons userName as scopeName
    const scope: ChatScope = { id: scopeId, userId: userId, userName: userName, scopeName: userName, type: "DirectConversation" };
    dispatch({ type: "AFTER_MEMBER_CLICK", payload: { chatScope: scope, isDirectMessagesDrawerShown: true } });
    websocketeer.send("GET_DIRECT_MESSAGES", { scopeId: scope.id });
  }, [state.directConversations, dispatch]);

  /**
   * Member Click Handlers map
   */
  const memberClickHandlers = useMemo(() => {
    return new Map(state.members?.map((member) => [member.userId, (): void => handleMemberClick(member)]));
  }, [state.members, handleMemberClick]);

  /**
   * Members render function
   */
  const renderMembers = useCallback(() => {
    console.log("[ChatView] in 'renderMembers' (this does not mean members ae rendering)");
    if (state.isEnteringRoom) {
      return <></>;
    }
    return state.members?.map((member) => (
      <MemberMemo
        memberId={member.userId}
        key={member.userId}
        isButton
        onClick={memberClickHandlers.get(member.userId)}
        memberName={member.userName}
        isOnline={member.isActive}
      />
    ));
  }, [state.members, state.isEnteringRoom, memberClickHandlers]);

  return (
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
        <DirectMessagesDrawerMemo isShown={state.isDirectMessagesDrawerShown} onClose={handleCloseDirectMessagesDrawer} />
      </div>
      <div className="card-footer">
        <div className="row">
          <div className="col-12 d-flex p-1">
            <button onClick={handleOpenDirectMessagesDrawer} className="btn btn-primary flex-grow-1 shadow" type="button" title="Direct Messages">
              <i className="bi bi-chat-dots-fill"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
