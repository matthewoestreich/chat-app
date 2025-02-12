import { WebSocket, ServerOptions } from "ws";
import jsonwebtoken from "jsonwebtoken";
import { WEBSOCKET_ERROR_CODE } from "./websocketErrorCodes";
import parseCookies from "./parseCookies";
import isAuthenticated from "./isAuthenticated";
import WebSocketApp from "./WebSocketApp";
import { DatabaseProvider } from "../types";
import { Message, PublicMember, PublicMessage, Room, User } from "@root/types.shared";

let DATABASE: DatabaseProvider;
const wsapp = new WebSocketApp();

export default async function startWebSocketApp<T>(options: ServerOptions, databaseProvider: DatabaseProvider<T>): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      DATABASE = databaseProvider;
      wsapp.listen(options, resolve);
    } catch (e) {
      reject(e);
    }
  });
}

// Catch any errors.
wsapp.catch((error: Error, socket: WebSocket) => {
  console.error({ error, user: socket.user! });
});

/**
 *
 * @event {CONNECTION_ESTABLISHED}
 *
 * CONNECTION_ESTABLISHED fires when a socket first connects to this server.
 * It's kind of like an "initial connection" event.
 *
 */
wsapp.on("CONNECTION_ESTABLISHED", async (client, { request }) => {
  const cookies = parseCookies(request.headers.cookie || "");

  if (!(await isAuthenticated(cookies?.session))) {
    const { code, definition } = WEBSOCKET_ERROR_CODE.Unauthorized;
    return client.socket.close(code, definition);
  }

  try {
    const decoded = jsonwebtoken.decode(cookies.session) as User;
    client.user = { userName: decoded.userName, id: decoded.id, email: decoded.email };

    const rooms = await DATABASE.rooms.selectByUserId(client.user.id);
    const directConvos = await DATABASE.directConversations.selectByUserId(client.user.id);
    const generalRoom = rooms.find((room) => room.name === "#general");
    const members = await DATABASE.rooms.selectRoomMembersExcludingUser(generalRoom!.id, client.user.id);
    const messages = await DATABASE.roomMessages.selectByRoomId(generalRoom!.id);

    client.send("CONNECTED", {
      rooms,
      directConversations: directConvos.map((dc) => ({ ...dc, isActive: wsapp.isItemCached(dc.userId) })),
      defaultRoom: {
        room: generalRoom!,
        members: members.map((m) => ({ ...m, isActive: wsapp.isItemCached(m.userId) })),
        messages,
      },
    });

    if (generalRoom === undefined) {
      client.setActiveIn(WebSocketApp.ID_UNASSIGNED, wsapp.addClientToCache(client, WebSocketApp.ID_UNASSIGNED));
    } else {
      client.setActiveIn(generalRoom.id, wsapp.addClientToCache(client, generalRoom.id));
    }

    // Blast a message to everyone that someone came online, so they can update status display bubble thingy.
    wsapp.blast("USER_CONNECTED", { userId: client.user.id }, client);
  } catch (e) {
    client.send("CONNECTED", { error: `Something went wrong! ${String(e)}`, rooms: [], directConversations: [] });
  }
});

/**
 *
 * @event {CONNECTION_CLOSED}
 *
 * CONNECTION_CLOSED fires when a socket is closed. This allows us to clean up and
 * log the reason for socket closure.
 *
 */
wsapp.on("CONNECTION_CLOSED", (client /*{ reason, code }*/) => {
  //client.broadcast("USER_DISCONNECTED", { userId: client.user.id });
  // TODO find better solution. like redis? For now just 'blast' a message to every single person,
  // telling them a user disconnected
  wsapp.blast("USER_DISCONNECTED", { userId: client.user.id }, client);
  if (client.activeIn) {
    wsapp.deleteCachedItem(client.user.id, client.activeIn.id);
  }
});

/**
 *
 * @event {CONNECTION_LOGOUT}
 *
 * Fires when someone logs out.
 *
 */
wsapp.on("CONNECTION_LOGOUT", (client) => {
  // TODO find better solution. like redis? For now just 'blast' a message to every single person,
  // telling them a user disconnected
  wsapp.blast("USER_DISCONNECTED", { userId: client.user.id }, client);
  wsapp.deleteCachedItem(client.user.id, client.activeIn.id);
});

/**
 *
 * @event {SEND_MESSAGE}
 *
 * Someone is sending a chat message to a room.
 *
 */
wsapp.on("SEND_MESSAGE", async (client, { message, scope }) => {
  try {
    let publicMessage: PublicMessage | null = null;
    let sentMessage: Message | null = null;

    switch (scope.type) {
      case "Room": {
        sentMessage = await DATABASE.roomMessages.create(client.activeIn.id, client.user.id, message);
        publicMessage = {
          scopeId: sentMessage.scopeId,
          userId: client.user.id,
          timestamp: sentMessage.timestamp,
          message: sentMessage.message,
          id: sentMessage.id,
          userName: client.user.userName,
        };
        client.broadcast("RECEIVE_MESSAGE", { message: publicMessage });
        break;
      }

      case "DirectConversation": {
        if (!scope.otherParticipantUserId) {
          throw new Error("Missing other participants userId!");
        }

        // If user is actively in convo, mark as read
        const isInActiveConvo = wsapp.getCachedContainer(scope.id).has(scope.otherParticipantUserId);
        sentMessage = await DATABASE.directMessages.create(scope.id, client.user.id, scope.otherParticipantUserId, message, isInActiveConvo);

        publicMessage = {
          message: sentMessage.message,
          id: sentMessage.id,
          scopeId: sentMessage.scopeId,
          timestamp: sentMessage.timestamp,
          userId: client.user.id,
          userName: client.user.userName,
        };

        if (isInActiveConvo) {
          // Since they are actively in same scope, we can just broadcast to that scope
          client.broadcast("RECEIVE_MESSAGE", { message: publicMessage });
          break;
        }
        // Here it doesn't matter if recipient is currently a member of direct convo or not, either way, we need to add them to it.
        // This query should not throw an error if they already are a member.
        await DATABASE.directConversations.addUserToDirectConversation(scope.id, scope.otherParticipantUserId);

        // Also, check if recipient is even online, if they are we can include frontend logic to alert them of a new direct convo.
        const recipient = wsapp.getCachedItem(scope.otherParticipantUserId);
        if (recipient) {
          client.sendDirectMessage(recipient, publicMessage);
          break;
        }

        break;
      }
    }

    if (publicMessage === null) {
      return client.send("SENT_MESSAGE", { error: new Error(`Scope '${scope.type}' is unrecognized.`), message: {} as PublicMessage });
    }
    client.send("SENT_MESSAGE", { message: publicMessage });
  } catch (e) {
    console.error(`[ERROR] TODO : handle this error better! From SEND_MESSAGE :`, e);
    client.send("SENT_MESSAGE", { error: e as Error, message: {} as PublicMessage });
  }
});

/**
 *
 * @event {ENTER_ROOM}
 *
 * ENTER_ROOM is for when a user enters an already joined room.
 * JOIN_ROOM is used when a user has joined a room they were not a member of prior.
 *
 */
wsapp.on("ENTER_ROOM", async (client, { id }) => {
  // Notify existing room (which user is now leaving) that user is leaving.
  if (client.activeIn && id !== client.activeIn.id) {
    client.broadcast("MEMBER_LEFT_ROOM", { id: client.user.id });
    wsapp.deleteCachedItem(client.user.id, client.activeIn.id);
  }

  const container = wsapp.addClientToCache(client, id);
  client.setActiveIn(id, container);
  client.broadcast("MEMBER_ENTERED_ROOM", { id: client.user.id });

  try {
    const room = await DATABASE.rooms.getById(id);
    const members = await DATABASE.rooms.selectRoomMembersExcludingUser(id, client.user.id);
    const messages = await DATABASE.roomMessages.selectByRoomId(id);

    client.send("ENTERED_ROOM", {
      room,
      messages,
      // Add `isActive` property for each user in this room based upon if they're cached in this room.
      members: members.map((m) => ({
        userName: m.userName,
        userId: m.userId,
        scopeId: m.scopeId,
        isActive: wsapp.isItemCached(m.userId),
      })),
    });
  } catch (e) {
    console.error(`[ERROR] TODO : handle this error better! From ENTER_ROOM :`, e);
    client.send("ENTERED_ROOM", { error: e as Error, members: [], messages: [], room: {} as Room });
  }
});

/**
 *
 * @event {JOIN_ROOM}
 *
 * JOIN_ROOM is used when a user has joined a room they were not a member of prior.
 * ENTER_ROOM is for when a user enters an already joined room.
 *
 */
wsapp.on("JOIN_ROOM", async (client, { id }) => {
  try {
    await DATABASE.rooms.addUserToRoom(client.user.id, id);
    const rooms = await DATABASE.rooms.selectByUserId(client.user.id);
    client.send("JOINED_ROOM", { rooms });
  } catch (e) {
    client.send("JOIN_ROOM", { error: e as Error, id: "" });
  }
});

/**
 *
 * @event {UNJOIN_ROOM}
 *
 * UNJOIN_ROOM is named "unjoin" as to not cause confusion with "enter" or "leave/left".
 * UNJOIN_ROOM fires when a user has removed a room from their "memberships", if you will.
 * (NOTE: a "membership" isn't a term/keyword/concept that exists in this app, just using the term for explanation)
 * `*_(LEAVE|LEFT)_*` events are different as the user has just "exited" the chat room.
 *
 */
wsapp.on("UNJOIN_ROOM", async (client, { id }) => {
  try {
    if (!(await DATABASE.rooms.removeUserFromRoom(client.user.id, id))) {
      throw new Error("Something went wrong while removing.");
    }

    client.send("UNJOINED_ROOM", { rooms: await DATABASE.rooms.selectByUserId(client.user.id) });

    // Covers the case for when a user unjoins a room they are currently chatting in.
    if (client.activeIn.container && client.activeIn.id === id) {
      client.broadcast("MEMBER_LEFT_ROOM", { id: client.user.id });
      wsapp.deleteCachedItem(client.user.id, client.activeIn.id);
    }
  } catch (e) {
    client.send("UNJOINED_ROOM", { error: e as Error, rooms: [] });
  }
});

/**
 *
 * @event {CREATE_ROOM}
 *
 * Creates a new room. The creator of the room is auto-joined.
 *
 */
wsapp.on("CREATE_ROOM", async (client, { name, isPrivate }) => {
  if (isPrivate === undefined) {
    isPrivate = false;
  }

  try {
    const room = await DATABASE.rooms.create(name, isPrivate === true ? 1 : 0);
    await DATABASE.rooms.addUserToRoom(client.user.id, room.id);
    const rooms = await DATABASE.rooms.selectByUserId(client.user.id);
    client.send("CREATED_ROOM", { id: room.id, rooms });
    wsapp.addContainerToCache(room.id);
  } catch (e) {
    client.send("CREATED_ROOM", { error: e as Error, id: "", rooms: [] });
  }
});

/**
 *
 * @event {CREATE_DIRECT_CONVERSATION}
 *
 * Create direct convo is used to explicitly create a new direct convo.
 *
 */
wsapp.on("CREATE_DIRECT_CONVERSATION", async (client, { withUserId }) => {
  try {
    const newConvo = await DATABASE.directConversations.create(client.user.id, withUserId);
    await DATABASE.directConversations.addUserToDirectConversation(newConvo.id, client.user.id);
    const directConvos = await DATABASE.directConversations.selectByUserId(client.user.id);
    const joinableConvos = await DATABASE.directConversations.selectInvitableUsersByUserId(client.user.id);

    client.send("CREATED_DIRECT_CONVERSATION", {
      joinableDirectConversations: joinableConvos.map((u) => ({ ...u, isActive: wsapp.isItemCached(u.userId) })),
      directConversations: directConvos.map((c) => ({ ...c, isActive: wsapp.isItemCached(c.userId) })),
      scopeId: newConvo.id,
    });
  } catch (e) {
    console.error(e);
    client.send("CREATED_DIRECT_CONVERSATION", { error: "Something went wrong!", directConversations: [], joinableDirectConversations: [], scopeId: "" });
  }
});

/**
 *
 * @event {LEAVE_DIRECT_CONVERSATION}
 *
 * Leaves a direct convo
 *
 */
wsapp.on("LEAVE_DIRECT_CONVERSATION", async (client, { id }) => {
  try {
    const result = await DATABASE.directConversations.removeUserFromDirectConversation(id, client.user.id);
    const convos = await DATABASE.directConversations.selectByUserId(client.user.id);
    if (!result) {
      return client.send("LEFT_DIRECT_CONVERSATION", { error: "Something went wrong!", directConversations: [] });
    }
    if (client.activeIn.id === id) {
      wsapp.deleteCachedItem(client.user.id, id);
      client.setActiveIn(WebSocketApp.ID_UNASSIGNED, wsapp.getCachedContainer(WebSocketApp.ID_UNASSIGNED));
    }
    client.send("LEFT_DIRECT_CONVERSATION", {
      directConversations: convos.map((convo) => ({ ...convo, isActive: wsapp.isItemCached(convo.userId) })),
    });
  } catch (e) {
    client.send("LEFT_DIRECT_CONVERSATION", { error: (e as Error).message || String(e), directConversations: [] });
  }
});

/**
 *
 * @event {GET_JOINABLE_ROOMS}
 *
 * Gets all rooms that a user is not already a member of.
 *
 */
wsapp.on("GET_JOINABLE_ROOMS", async (client) => {
  try {
    client.send("LIST_JOINABLE_ROOMS", { rooms: await DATABASE.rooms.selectUnjoinedRooms(client.user.id) });
  } catch (e) {
    client.send("LIST_JOINABLE_ROOMS", { error: e as Error, rooms: [] });
  }
});

/**
 *
 * @event {ENTER_DIRECT_CONVERSATION}
 *
 * Gets all messages in a direct conversation.
 *
 */
wsapp.on("ENTER_DIRECT_CONVERSATION", async (client, { directConversation, isProgrammatic }) => {
  try {
    const messages = await DATABASE.directMessages.selectByDirectConversationId(directConversation.scopeId);
    wsapp.deleteCachedItem(client.user.id, client.activeIn.id);
    client.setActiveIn(directConversation.scopeId, wsapp.addClientToCache(client, directConversation.scopeId));
    client.send("ENTERED_DIRECT_CONVERSATION", { messages, directConversation, isProgrammatic });
  } catch (e) {
    client.send("ENTERED_DIRECT_CONVERSATION", { error: (e as Error).message, messages: [], directConversation: {} as PublicMember, isProgrammatic: false });
  }
});

/**
 *
 * @event {GET_JOINABLE_DIRECT_CONVERSATIONS}
 *
 * Gets all users you are not currently in a direct conversation with..
 *
 */
wsapp.on("GET_JOINABLE_DIRECT_CONVERSATIONS", async (client) => {
  try {
    const users = await DATABASE.directConversations.selectInvitableUsersByUserId(client.user.id);
    client.send("LIST_JOINABLE_DIRECT_CONVERSATIONS", {
      // Add `isActive` field for each user
      conversations: users.map((u) => ({ ...u, isActive: wsapp.isItemCached(u.userId) })),
    });
  } catch (e) {
    client.send("LIST_JOINABLE_DIRECT_CONVERSATIONS", { error: e as Error, conversations: [] });
  }
});
