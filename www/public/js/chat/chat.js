/* Members & Rooms elements */
const sendChatBtn = document.getElementById("send-chat-btn");
const roomsContainer = document.getElementById("rooms-container");
const membersContainer = document.getElementById("members-container");
const loadingRoomsSpinner = document.getElementById("loading-rooms-spinner");
const loadingMembersSpinner = document.getElementById("loading-members-spinner");
const directMessagesDrawer = document.getElementById("direct-messages-drawer");
const directMessagesDrawerContainer = document.getElementById("direct-messages-container");
const openDirectMessagesDrawer = document.getElementById("open-direct-messages");
const closeDirectMessagesDrawer = document.getElementById("close-direct-messages-drawer");
const closeDirectMessagesDrawerFooterBtn = document.getElementById("close-dms-footer-btn");
/* Leave room confirmation modal */
const leaveRoomConfirmationModal = document.getElementById("leave-room-confirmation-modal");
const leaveRoomConfirmationModalBody = document.getElementById("leave-room-confirmation-modal-body");
const openLeaveRoomConfirmModalBtn = document.getElementById("leave-room-btn");
const confirmedLeaveRoomBtn = document.getElementById("leave-room-confirmation-modal-confirmed-leave-btn");
/* Create room modal */
const createRoomModal = document.getElementById("create-room-modal");
const openCreateRoomModalBtn = document.getElementById("open-create-room-modal-btn");
const createRoomBtn = document.getElementById("create-room-btn");
const createRoomRoomNameInput = document.getElementById("create-room-name-input");
const createRoomIsPrivateCheckbox = document.getElementById("create-room-isprivate-checkbox");
const createRoomForm = document.getElementById("create-room-form");
const createRoomStatusEl = document.getElementById("create-room-alert");
const createRoomAlert = document.getElementById("create-room-alert");
const createRoomAlertMessage = document.getElementById("create-room-alert-message");
/* Join room modal */
const joinRoomModal = document.getElementById("join-room-modal");
const openJoinRoomModalBtn = document.getElementById("open-join-room-modal");
const joinRoomBtn = document.getElementById("join-room-btn");
const joinRoomModalRoomsContainer = document.getElementById("join-room-modal-rooms-container");
const joinRoomModalAlert = document.getElementById("join-room-alert");
const joinRoomModalAlertMessage = document.getElementById("join-room-alert-message");
/* Chat related elements */
const chatDisplay = document.getElementById("chat-display");
const chatTextInput = document.getElementById("chat-text-input");
const chatTitle = document.getElementById("chat-title");
/* Join direct convo modal */
const joinDirectConvoModal = document.getElementById("join-direct-convo-modal");
const createDirectConvoBtn = document.getElementById("create-direct-conversation-btn");
const joinDirectConvoModalPeopleContainer = document.getElementById("join-direct-convo-modal-people-container");
/* bootstrap instances/objects */
const bsLeaveConfirmationModal = bootstrap.Modal.getOrCreateInstance(leaveRoomConfirmationModal);
const bsCreateRoomModal = bootstrap.Modal.getOrCreateInstance(createRoomModal);
const bsJoinRoomModal = bootstrap.Modal.getOrCreateInstance(joinRoomModal);
const bsJoinDirectConvoModal = bootstrap.Modal.getOrCreateInstance(joinDirectConvoModal);
//#endregion

const createRoomCallout = new CustomAlert(createRoomAlert, createRoomAlertMessage);
const joinRoomCallout = new CustomAlert(joinRoomModalAlert, joinRoomModalAlertMessage);

/**
 * Events & Event Handlers
 */

chatTextInput.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") {
    return;
  }
  e.preventDefault();
  sendChatBtn.click();
});

sendChatBtn.addEventListener("click", (e) => {
  const activeRoom = roomsContainer.querySelector(".active-room");
  if (!activeRoom) {
    return;
  }
  if (!chatTextInput.value) {
    return;
  }
  wsapp.send(new WebSocketMessage(EventType.SEND_MESSAGE, { message: chatTextInput.value }));
  const opts = { message: chatTextInput.value, displayName: USER_NAME, isSending: true, isError: false };
  const msgHTML = generateChatHTML(opts);
  chatTextInput.value = "";
  chatDisplay.appendChild(msgHTML);
  scrollToBottomOfElement(chatDisplay);
});

createDirectConvoBtn.addEventListener("click", (event) => {
  // open join new direct convo modal
  bsJoinDirectConvoModal.show();
  wsapp.send(new WebSocketMessage(EventType.LIST_INVITABLE_USERS, {}));
});

createRoomBtn.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  const revert = addSpinnerToButton(createRoomBtn, "Please wait...");
  createRoomForm.isValid = createRoomForm.checkValidity();
  createRoomForm.classList.add("was-validated");
  if (!createRoomForm.isValid) {
    revert();
    return;
  }
  const name = createRoomRoomNameInput.value;
  const isPrivate = createRoomIsPrivateCheckbox.checked === true ? 1 : 0;
  wsapp.send(new WebSocketMessage(EventType.CREATE_ROOM, { name, isPrivate }));
});

joinRoomBtn.addEventListener("click", (event) => {
  const selected = joinRoomModalRoomsContainer.querySelector(".active");
  if (!selected) {
    return;
  }
  addSpinnerToButton(joinRoomBtn, "Please wait...");
  wsapp.send(new WebSocketMessage(EventType.JOIN_ROOM, { id: selected.id }));
});

openLeaveRoomConfirmModalBtn.addEventListener("click", (event) => {
  const activeRoom = roomsContainer.querySelector(".active-room");
  if (!activeRoom) {
    return;
  }
  leaveRoomConfirmationModalBody.innerText = `Are you sure you want to leave room '${activeRoom.getAttribute("name")}'?`;
  bsLeaveConfirmationModal.show();
});

openJoinRoomModalBtn.addEventListener("click", (event) => {
  wsapp.send(new WebSocketMessage(EventType.GET_JOINABLE_ROOMS, {}));
  bsJoinRoomModal.show();
});

openCreateRoomModalBtn.addEventListener("click", (event) => {
  bsCreateRoomModal.show();
});

confirmedLeaveRoomBtn.addEventListener("click", (event) => {
  const activeRoom = roomsContainer.querySelector(".active-room");
  if (!activeRoom) {
    bsLeaveConfirmationModal.hide();
    return;
  }
  addSpinnerToButton(confirmedLeaveRoomBtn, "Please wait...");
  wsapp.send(new WebSocketMessage(EventType.UNJOIN_ROOM, { id: activeRoom.id }));
});

joinRoomModal.addEventListener("shown.bs.modal", (event) => {
  joinRoomModal.querySelector("#cancel-join-room-btn").setAttribute("data-cy", "join-room-modal");
});

joinRoomModal.addEventListener("hidden.bs.modal", (event) => {
  const revert = getSpinnerButtonInstance(joinRoomBtn);
  if (revert) {
    revert();
  }
  joinRoomModalRoomsContainer.replaceChildren();
  joinRoomCallout.close();
  // This is for Cypress tests only
  joinRoomModal.querySelector("#cancel-join-room-btn").removeAttribute("data-cy");
});

// Clear form when modal is hidden.
createRoomModal.addEventListener("hidden.bs.modal", (event) => {
  createRoomRoomNameInput.value = "";
  createRoomIsPrivateCheckbox.checked = false;
});

openDirectMessagesDrawer.addEventListener("click", (e) => {
  directMessagesDrawer.classList.toggle("open");
  wsapp.send(new WebSocketMessage(EventType.LIST_DIRECT_CONVERSATIONS, {}));
});

// Button at top right of DM's drawer (shown as an X).
closeDirectMessagesDrawer.addEventListener("click", (e) => {
  directMessagesDrawer.classList.toggle("open");
});

// Button within DM's drawer (located at footer).
closeDirectMessagesDrawerFooterBtn.addEventListener("click", (e) => {
  directMessagesDrawer.classList.toggle("open");
});

/**
 * HTML related functions/handlers
 */

function handleRoomClick(event, self) {
  openLeaveRoomConfirmModalBtn.disabled = false;
  // If DM's are open, close them..
  directMessagesDrawer.classList.remove("open");
  const currentActiveRoom = roomsContainer.querySelector(".active-room");
  if (currentActiveRoom === self) {
    return;
  }
  chatDisplay.replaceChildren();
  document.getElementById("members-list").replaceChildren();
  chatTitle.classList.remove("chat-title-no-room");
  chatTitle.innerText = self.innerText;
  self.classList.add("active-room");
  currentActiveRoom?.classList?.remove("active-room");
  wsapp.send(new WebSocketMessage(EventType.ENTER_ROOM, { id: self.id }));
}

function handleDirectConversationClick(event, theElement) {
  chatTitle.classList.remove("chat-title-no-room");
  chatTitle.innerText = theElement.getAttribute("name") || `Direct Message`;
  // Only auto-close drawer if we are on small screens
  const currBp = getCurrentBreakpoint();
  if (currBp === "sm" || currBp === "xs") {
    directMessagesDrawer.classList.toggle("open");
  }
  wsapp.send(new WebSocketMessage(EventType.LIST_DIRECT_MESSAGES, { id: theElement.id }));
}

/**
 * WebSocket related functions/handlers
 */

function handleRooms(appendToElement, rooms, onRenderDone = () => {}) {
  rooms.sort((a, b) => a.name.localeCompare(b.name));
  renderRooms(appendToElement, rooms, onRenderDone);
}

// Joinable entity is like a room or direct conversation
function handleJoinableEntity(appendToElement, entities) {
  appendToElement.replaceChildren(); // clear anything existing..
  for (const entity of entities) {
    const entityEl = generateJoinableEntityHTML(entity.name, entity.id);
    entityEl.addEventListener("click", function (event) {
      const currentActive = appendToElement.querySelector(".active");
      if (currentActive === this) {
        return;
      }
      if (currentActive) {
        currentActive.classList.remove("active");
      }
      this.classList.add("active");
    });
    appendToElement.appendChild(entityEl);
  }
}

function handleDirectConversations(conversations, appendToElement = directMessagesDrawerContainer) {
  sortObjects(conversations);
  renderDirectConversations(conversations, appendToElement);
}

function handleJoinedRoom(rooms) {
  const revert = getSpinnerButtonInstance(joinRoomBtn);
  if (revert) {
    revert();
  }
  rooms.sort((a, b) => a.name.localeCompare(b.name));
  handleRooms(roomsContainer, rooms, () => {
    const r = joinRoomModalRoomsContainer.querySelector(".active");
    joinRoomModalRoomsContainer.removeChild(r);
    // Even tho the id is the same, it is a different element.
    // We removed it from the 'list of rooms to join' and added it
    // to the 'list of rooms we are currently in'.
    scrollToElement(document.getElementById(r.id));
  });
  joinRoomCallout.showWithIcon("success", "Successfully joined room!", "bi-check");
}

function handleRoomMembers(members, containerElement) {
  window.rtcRoomMembers = members;
  sortObjects(window.rtcRoomMembers);
  renderMembers(members, containerElement);
}

function handleCreatedRoom(rooms, createdRoomId) {
  getSpinnerButtonInstance(createRoomBtn)();
  createRoomCallout.showWithIcon("success", "Success! Room created successfully.", "bi-check");
  rooms.sort((a, b) => a.name.localeCompare(b.name));
  handleRooms(roomsContainer, rooms, () => {
    scrollToElement(document.getElementById(createdRoomId));
  });
  //bsCreateRoomModal.hide();
}

// Received message
function handleMessage(userName, messageText, userId) {
  const opts = { message: messageText, displayName: userName, isSending: false, userId };
  const msgHTML = generateChatHTML(opts);
  chatDisplay.appendChild(msgHTML);
  scrollToBottomOfElement(chatDisplay);
}

function handleUnjoined(updatedRooms) {
  const revert = getSpinnerButtonInstance(confirmedLeaveRoomBtn);
  if (revert) {
    revert();
  }
  bsLeaveConfirmationModal.hide();
  handleRooms(roomsContainer, updatedRooms);
  // Clear members and chat from display
  chatDisplay.replaceChildren();
  handleRoomMembers([], membersContainer);
}

function handleDirectMessages(messages = []) {
  if (!messages.length) {
    return;
  }
  chatDisplay.replaceChildren();
  messages.forEach(({ message, fromUserId, fromUserName }) => {
    const opts = { message, displayName: fromUserName, isSending: fromUserId === USER_ID };
    const html = generateChatHTML(opts);
    chatDisplay.appendChild(html);
  });
  scrollToBottomOfElement(chatDisplay);
}

function handleEnteredRoom(members, messages) {
  handleRoomMembers(members);
  messages.forEach(({ message, userId, userName }) => {
    const isSending = userId === USER_ID;
    const opts = { message, isSending, displayName: userName };
    const html = generateChatHTML(opts);
    chatDisplay.appendChild(html);
  });
  scrollToBottomOfElement(chatDisplay);
}

function handleMemberEntered(id) {
  if (!window.rtcRoomMembers) {
    return;
  }
  const idx = window.rtcRoomMembers.findIndex((m) => m.userId === id);
  if (idx !== -1) {
    window.rtcRoomMembers[idx].isActive = true;
  }
  sortObjects(window.rtcRoomMembers);
  renderMembers(window.rtcRoomMembers);
}

function handleMemberLeft(id) {
  if (!window.rtcRoomMembers) {
    return;
  }
  const idx = window.rtcRoomMembers.findIndex((m) => m.userId === id);
  if (idx !== -1) {
    window.rtcRoomMembers[idx].isActive = false;
  }
  sortObjects(window.rtcRoomMembers);
  renderMembers(window.rtcRoomMembers);
}

function createMessage(type = "", data = {}) {
  return JSON.stringify({ type, ...data });
}

/**
 * Render functions
 */

// @param {HTMLElement} containerElement : The "ul" element where members are rendered
// (within the members "column") is also where we display direct messages/convos. Therefore,
// we don't want to reset that entire HTML tree when we render new members. However, we do
// want to keep the option to provide a contaner just in case. We default to the "membersContainer",
// aka the "members column".
function renderMembers(members, containerElement = membersContainer) {
  const membersListElement = document.getElementById("members-list");
  membersListElement.replaceChildren();
  if (!members.length) {
    return;
  }
  for (const m of members) {
    const memberHTML = generateMemberHTML(m.userName, m.userId, m.isActive);
    membersListElement.appendChild(memberHTML);
  }
  if (containerElement) {
    containerElement.appendChild(membersListElement);
  }
}

function renderRooms(containerElement, rooms, onCompleted = () => {}) {
  containerElement.replaceChildren();
  loadingRoomsSpinner.classList.add("d-none");
  if (!rooms.length) {
    return;
  }
  let roomsListElement = document.createElement("ul");
  roomsListElement.classList.add("list-group");
  for (const r of rooms) {
    const roomHtml = generateRoomHTML(r.name, r.id);
    roomHtml.addEventListener("click", function (e) {
      handleRoomClick(e, this);
    });
    roomsListElement.appendChild(roomHtml);
  }
  containerElement.appendChild(roomsListElement);
  onCompleted();
}

function renderDirectConversations(conversations, appendToElement) {
  const convoListElement = document.createElement("ul");
  convoListElement.classList.add("list-group", "list-group-flush");
  for (const convo of conversations) {
    const html = generateDirectConversationHTML(convo.id, convo.userName, convo.userId, convo.isActive);
    html.setAttribute("role", "button");
    html.addEventListener("click", function (event) {
      handleDirectConversationClick(event, this);
    });
    convoListElement.appendChild(html);
  }

  if (appendToElement) {
    appendToElement.replaceChildren();
    appendToElement.appendChild(convoListElement);
  }
}

/**
 * Generate HTML functions
 */

function generateChatHTML(opts = { message: "", displayName: "", isError: false }) {
  let { message, displayName, isError } = opts;
  const messageDiv = document.createElement("div");
  messageDiv.setAttribute("name", displayName);
  const messageBodyDiv = document.createElement("div");
  const messageHeaderSpan = document.createElement("span");
  if (isError) {
    messageBodyDiv.style.backgroundColor = "red";
  }
  const renderHeader = () => {
    messageHeaderSpan.classList.add("message-header");
    messageHeaderSpan.innerText = displayName;
    messageDiv.style.marginTop = "0.67rem";
    messageDiv.appendChild(messageHeaderSpan);
  };
  const isLastMessageFromCurrentSender = () => {
    // If last message is from the same person, skip the name
    if (chatDisplay.childElementCount > 0) {
      const lastMsg = chatDisplay.childNodes[chatDisplay.childNodes.length - 1];
      return lastMsg.getAttribute("name") === displayName;
    }
    return false;
  };
  messageDiv.classList.add("message");
  messageBodyDiv.classList.add("message-body");
  messageBodyDiv.innerText = message;
  if (!isLastMessageFromCurrentSender()) {
    renderHeader();
  }
  messageDiv.appendChild(messageBodyDiv);
  return messageDiv;
}

function generateMemberJoinedChatHTML(name = "foo") {
  const div = document.createElement("div");
  div.classList.add("member-joined-bubble", "text-center", "text-dark");
  div.innerText = `${name} has entered the chat!`;
  return div;
}

function generateMemberHTML(name, id, isActive) {
  const li = document.createElement("li");
  const divUnContainer = document.createElement("div");
  const divUn = document.createElement("div");
  const span = document.createElement("span");
  li.id = id;
  li.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-start");
  divUnContainer.classList.add("ms-2", "me-auto");
  divUn.innerText = name;
  span.id = `${id}-status`;
  const status = isActive ? "text-bg-success" : "text-bg-warning";
  span.classList.add("badge", "rounded-pill", status);
  // This empty space is intentional
  span.innerText = " ";
  divUnContainer.appendChild(divUn);
  li.appendChild(divUnContainer);
  li.appendChild(span);
  return li;
}

function generateRoomHTML(roomName, roomId, text) {
  const listItemLi = document.createElement("li");
  const cardDiv = document.createElement("div");
  const cardBodyDiv = document.createElement("div");
  const cardTitleH5 = document.createElement("h5");
  const cardTextP = document.createElement("p");
  listItemLi.classList.add("list-group-item", "p-1", "border-0");
  listItemLi.id = roomId;
  listItemLi.setAttribute("name", roomName);
  listItemLi.setAttribute("data-bs-dismiss", "offcanvas");
  listItemLi.setAttribute("data-bs-target", "#rooms-offcanvas");
  cardDiv.classList.add("card");
  cardDiv.setAttribute("role", "button"); // For the pointer cursor.
  cardBodyDiv.classList.add("card-body");
  cardTitleH5.classList.add("card-title");
  cardTitleH5.textContent = roomName;
  cardTextP.classList.add("card-text");
  cardTextP.innerText = text || "";
  cardBodyDiv.appendChild(cardTitleH5);
  cardBodyDiv.appendChild(cardTextP);
  cardDiv.appendChild(cardBodyDiv);
  listItemLi.appendChild(cardDiv);
  return listItemLi;
}

function generateJoinableEntityHTML(entityName, entityId, showIdInDisplay = true) {
  const li = document.createElement("li");
  const pEntityName = document.createElement("div");
  const pEntityId = document.createElement("p");
  li.classList.add("list-group-item", "list-group-item-action");
  li.type = "button";
  li.id = entityId;
  li.setAttribute("name", entityName);
  pEntityName.innerText = entityName;
  pEntityName.classList.add("fw-bold", "fs-5");
  pEntityName.style.textDecoration = "bold";
  pEntityId.style.fontSize = "0.6em";
  if (showIdInDisplay) {
    pEntityId.innerText = entityId;
  }
  li.appendChild(pEntityName);
  li.appendChild(pEntityId);
  return li;
}

// Generates an "li" element with participant info..
function generateDirectConversationHTML(conversationId, participantName, participantId, isActive) {
  const li = document.createElement("li");
  const divUnContainer = document.createElement("div");
  const divUn = document.createElement("div");
  const span = document.createElement("span");
  li.id = conversationId; //participantId;
  li.setAttribute("name", participantName);
  li.classList.add("list-group-item", "list-group-item-action", "d-flex", "justify-content-between", "align-items-start");
  divUnContainer.classList.add("ms-2", "me-auto");
  divUn.innerText = participantName;
  span.id = `${participantId}-status`;
  const status = isActive ? "text-bg-success" : "text-bg-warning";
  span.classList.add("badge", "rounded-pill", status);
  // This empty space is intentional
  span.innerText = " ";
  divUnContainer.appendChild(divUn);
  li.appendChild(divUnContainer);
  li.appendChild(span);
  return li;
}

/**
 * MISC FUNCTIONS
 */

// Expects `members` param to be an array of objects that must have an "isActive" key,
// as well as another key with some variation of "name" in it... we sort by
// active status then by name.
// - eg. `{ "*.(N|n)ame": string, isActive: boolean }`
// - example : `{ userName: 'foo', isActive: true, ...rest }` is acceptable
// - example : `{ user: 'foo', isActive: true, ...rest }` is NOT acceptable
// The "*(N|n)ame" key just has to have "name" in it somewhere..
// If no suitable keys are found, we return nothing since sort is in place anyway..
function sortObjects(objects = []) {
  if (!objects.length) {
    return;
  }

  let nameKey = null;
  let hasIsValueKey = false;

  const objectKeys = Object.keys(objects[0]);

  if (!objectKeys.length) {
    return;
  }

  for (const key of objectKeys) {
    const keyLower = key.toLowerCase();
    if (!nameKey && keyLower.includes("name")) {
      nameKey = key;
    }
    if (keyLower === "isactive") {
      hasIsValueKey = true;
    }
    if (hasIsValueKey && nameKey !== null) {
      // can break early
      break;
    }
  }
  if (!nameKey) {
    console.error(`[sortObjects] no suitable "*(N|n)ame" key found on objects. We got:`, { objectKeys });
    return;
  }
  if (!hasIsValueKey) {
    console.error(`[sortObjects] no suitable "isActive" key found on objects. We got:`, { objectKeys });
    return;
  }
  objects.sort((a, b) => {
    if (a.isActive && b.isActive) {
      return a[nameKey].localeCompare(b[nameKey]);
    }
    if (!a.isActive && !b.isActive) {
      return a[nameKey].localeCompare(b[nameKey]);
    }
    if (a.isActive) {
      return -1; // Here, if 'a' is active, 'b' has to be inactive.
    }
    return 1; // Here, we can safely assume 'b' is active and 'a' is inactive.
  });
}

function scrollToElement(element) {
  if (!element) {
    return;
  }
  element.scrollIntoView({
    behavior: "smooth", // Smooth scrolling
    block: "start", // Align to the top of the container
  });
}

function scrollToBottomOfElement(element) {
  element.scrollTop = element.scrollHeight;
}

function getCurrentBreakpoint() {
  if (window.innerWidth < 576) {
    return "xs";
  } else if (window.innerWidth >= 576 && window.innerWidth < 768) {
    return "sm";
  } else if (window.innerWidth >= 768 && window.innerWidth < 992) {
    return "md";
  } else if (window.innerWidth >= 992 && window.innerWidth < 1200) {
    return "lg";
  } else if (window.innerWidth >= 1200 && window.innerWidth < 1400) {
    return "xl";
  } else {
    return "xxl";
  }
}
