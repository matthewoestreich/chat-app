const elements = new Proxy(
  {},
  {
    get(target, prop) {
      if (!target[prop]) {
        target[prop] = document.getElementById(prop);
      }
      return target[prop];
    },
  },
);

const elementIds = {
  modals: {
    createRoom: { modal: "", open: "", input: { name: "", isPrivate: "" } },
    joinRoom: { modal: "", open: "" },
    leaveRoom: { modal: "", open: "", body: "", confirmButton: "" },
  },
};

const initialState = {
  chatTitle: "Please join a room",
  activeIn: {
    id: null,
    name: null,
    type: null, // "room" | "direct_conversation"
    members: [],
  },
};

elements["chat-text-input"].addEventListener("keydown", (e) => {
  if (e.key !== "Enter") {
    return;
  }
  e.preventDefault();
  elements["send-chat-btn"].click();
});
