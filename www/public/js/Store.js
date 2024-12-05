class Store {
  constructor(options = { initialState: {}, actions: {} }) {
    this.actions = options.actions; // { "doSomething": (state) => {} }
    this.state = options.initialState;
    this.events = {};
  }

  dispatch(actionKey, payload) {
    if (!this.actions[actionKey]) {
      console.error(`no such action '${actionKey}'`);
      return;
    }
    const newState = this.actions[actionKey](this.state, payload);
    this.state = { ...newState };
    this.emit(actionKey, this.state, payload);
  }

  // .on("increment", (newState) => {
  //   counterElement.innerHTML = newState.count;
  // })
  on(actionKey, handler) {
    if (!this.actions[actionKey]) {
      console.log("[.on] cannot create event for non-existent actoin", actionKey);
      return;
    }
    if (!this.events[actionKey]) {
      this.events[actionKey] = [];
    }
    this.events[actionKey].push(handler);
  }

  emit(actionKey, ...args) {
    if (!this.events[actionKey]) {
      console.log(`[.emit] cannot emit event for non existent action`, actionKey);
      return;
    }
    this.events[actionKey].forEach((h) => h(...args));
  }
}
