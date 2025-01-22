/**
 * Utility to query DOM elements by ID
 */
const $id = (id) => document.getElementById(id);

/**
 * App state
 */

let state = {};

/**
 * Element selectors
 */
/*
// Leave room confirmation modal
// Create room modal
const openCreateRoomModalBtn = document.getElementById("open-create-room-modal-btn");
const createRoomBtn = document.getElementById("create-room-btn");
const createRoomRoomNameInput = document.getElementById("create-room-name-input");
const createRoomIsPrivateCheckbox = document.getElementById("create-room-isprivate-checkbox");
const createRoomForm = document.getElementById("create-room-form");
const createRoomStatusEl = document.getElementById("create-room-alert");
const createRoomAlert = document.getElementById("create-room-alert");
const createRoomAlertMessage = document.getElementById("create-room-alert-message");
// Join room modal
const joinRoomModal = document.getElementById("join-room-modal");
const openJoinRoomModalBtn = document.getElementById("open-join-room-modal");
const joinRoomBtn = document.getElementById("join-room-btn");
const joinRoomModalRoomsContainer = document.getElementById("join-room-modal-rooms-container");
const joinRoomModalAlert = document.getElementById("join-room-alert");
const joinRoomModalAlertMessage = document.getElementById("join-room-alert-message");
// Chat related elements
const chatDisplay = document.getElementById("chat-display");
const chatTextInput = document.getElementById("chat-text-input");
const chatTitle = document.getElementById("chat-title");
// Join direct convo modal
const joinDirectConvoModal = document.getElementById("join-direct-convo-modal");
const createDirectConvoBtn = document.getElementById("create-direct-conversation-btn");
const joinDirectConvoModalPeopleContainer = document.getElementById("join-direct-convo-modal-people-container");
// bootstrap instances/objects
const bsLeaveConfirmationModal = bootstrap.Modal.getOrCreateInstance(leaveRoomConfirmationModal);
const bsCreateRoomModal = bootstrap.Modal.getOrCreateInstance(createRoomModal);
const bsJoinRoomModal = bootstrap.Modal.getOrCreateInstance(joinRoomModal);
const bsJoinDirectConvoModal = bootstrap.Modal.getOrCreateInstance(joinDirectConvoModal);
*/
const elementsByType = {
  buttons: {
    sendChat: $id("send-chat-btn"),
    openLeaveRoomModal: $id("leave-room-btn"),
    openJoinRoomModal: $id("open-join-room-modal"),
    openDirectMessages: $id("open-direct-messages"),
    submitJoinRoom: $id("join-room-btn"),
  },
};

const elementsByRole = {
  chat: {
    sendButton: $id("send-chat-btn"),
    display: $id("chat-display"),
    input: $id("chat-text-input"),
    title: $id("chat-title"),
  },
  rooms: {
    spinner: $id("loading-rooms-spinner"),
    container: $id("rooms-container"),
    join: {
      openModal: $id("open-join-room-modal"),
      submit: $id("join-room-btn"),
    },
    leave: {
      openModal: $id("leave-room-btn"),
    },
    create: {
      submit: $id("create-room-btn"),
      form: $id("create-room-form"),
      name: $id("create-room-name-input"),
      isPrivate: $id("create-room-isprivate-checkbox"),
      alert: $id("create-room-alert"),
      alertMessage: $id("create-room-alert-message"),
      openModal: $id("open-create-room-modal-btn"),
    },
  },
  members: {
    container: $id("members-container"),
    spinner: $id("loading-members-spinner"),
  },
  modals: {
    createRoom: $id("create-room-modal"),
    joinRoom: $id("join-room-modal"),
    leaveRoom: $id("leave-room-confirmation-modal"),
    directConvo: $id("join-direct-convo-modal"),
  },
  directMessages: {
    drawer: $id("direct-messages-drawer"),
    container: $id("direct-messages-container"),
    openButton: $id("open-direct-messages"),
    closeButton: $id("close-direct-messages-drawer"),
    closeButtonOnFooter: $id("close-dms-footer-btn"),
  },
};

/**
 * Bootstrap modals
 */
const bootstrapModals = {
  leaveRoom: bootstrap.Modal.getOrCreateInstance(elementsByRole.modals.leaveRoom),
  createRoom: bootstrap.Modal.getOrCreateInstance(elementsByRole.modals.createRoom),
  joinRoom: bootstrap.Modal.getOrCreateInstance(elementsByRole.modals.joinRoom),
  directConvo: bootstrap.Modal.getOrCreateInstance(elementsByRole.modals.directConvo),
};

/**
 * Event Handlers
 */
const eventHandlers = {
  onSendMessage: () => {
    const activeRoom = elementsByRole.rooms.container.querySelector(".active-room");
    if (!activeRoom || !elementsByRole.chat.input.value) return;

    const message = elementsByRole.chat.input.value;
    wsapp.send(new WebSocketMessage(EventType.SEND_MESSAGE, { message }));

    const messageHTML = generateChatHTML({ message, displayName: USER_NAME, isSending: true });
    elementsByRole.chat.display.appendChild(messageHTML);
    elementsByRole.chat.input.value = "";
    scrollToBottomOfElement(elementsByRole.chat.display);
  },

  onCreateRoom: (event) => {
    event.preventDefault();
    const { createButton, createForm, nameInput, privateCheckbox } = elementsByRole.rooms;

    const revertSpinner = addSpinnerToButton(createButton, "Please wait...");
    createForm.isValid = createForm.checkValidity();
    createForm.classList.add("was-validated");

    if (!createForm.isValid) {
      return revertSpinner();
    }

    wsapp.send(
      new WebSocketMessage(EventType.CREATE_ROOM, {
        name: nameInput.value,
        isPrivate: privateCheckbox.checked ? 1 : 0,
      }),
    );
  },

  onJoinRoom: (event) => {
    const selectedRoom = elementsByRole.rooms.joinModal.querySelector(".active");
    if (!selectedRoom) {
      return;
    }
    addSpinnerToButton(elementsByRole.rooms.joinButton, "Please wait...");
    wsapp.send(new WebSocketMessage(EventType.JOIN_ROOM, { id: selectedRoom.id }));
  },

  onOpenDrawer: (event) => {
    elementsByRole.directMessages.drawer.classList.toggle("open");
    wsapp.send(new WebSocketMessage(EventType.GET_DIRECT_CONVERSATIONS, {}));
  },

  onCloseDrawer: (event) => {
    elementsByRole.directMessages.drawer.classList.toggle("open");
  },
};

/**
 * Initialize Events
 */
const initEvents = () => {
  elementsByRole.chat.sendButton.addEventListener("click", (e) => {
    eventHandlers.onSendMessage(e);
  });

  elementsByRole.chat.input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      eventHandlers.onSendMessage();
    }
  });

  elementsByRole.rooms.create.submit.addEventListener("click", (e) => {
    eventHandlers.onCreateRoom(e);
  });

  elementsByRole.rooms.join.submit.addEventListener("click", (e) => {
    eventHandlers.onJoinRoom(e);
  });

  elementsByRole.directMessages.openButton.addEventListener("click", (e) => {
    eventHandlers.onOpenDrawer(e);
  });

  elementsByRole.directMessages.closeButton.addEventListener("click", (e) => {
    eventHandlers.onCloseDrawer(e);
  });

  elementsByRole.directMessages.closeFooterButton.addEventListener("click", (e) => {
    eventHandlers.onCloseDrawer(e);
  });
};

/**
 * Render Functions
 */
const render = {
  rooms: (rooms) => {
    const { container, spinner } = elementsByRole.rooms;
    spinner.classList.add("d-none");
    container.innerHTML = ""; // Clear existing rooms

    if (!rooms.length) {
      return;
    }

    const roomList = document.createElement("ul");
    roomList.classList.add("list-group");

    rooms.forEach((room) => {
      const roomItem = generateRoomHTML(room.name, room.id);
      roomItem.addEventListener("click", (e) => handleRoomClick(e, roomItem));
      roomList.appendChild(roomItem);
    });

    container.appendChild(roomList);
  },

  members: (members) => {
    const memberList = document.getElementById("members-list");
    memberList.innerHTML = ""; // Clear previous members

    members.forEach((member) => {
      const memberHTML = generateMemberHTML(member.userName, member.userId, member.isActive);
      memberList.appendChild(memberHTML);
    });
  },

  directMessages: (conversations) => {
    const { container } = elementsByRole.directMessages;
    container.innerHTML = ""; // Clear previous messages

    conversations.forEach((convo) => {
      const convoHTML = generateDirectConversationHTML(convo.id, convo.userName, convo.userId, convo.isActive);
      convoHTML.addEventListener("click", (e) => handleDirectConversationClick(e, convoHTML));
      container.appendChild(convoHTML);
    });
  },
};

/**
 * Initialize Application
 */
const initApp = () => {
  initEvents();
};

// Start the app
initApp();
