// Custom HTML Element for status updates in a callout-like fashion.
//
// - Usage:
//    // Use in DOM like a regular HTML element... (some attributes may not work as expected)
//    <rtc-loading-button id="loading-btn">Click Me</rtc-loading-button>
//
//    // Target element via JS.
//    const btn = document.getElementById("loading-btn");
//
class LoadingButton extends HTMLButtonElement {
  loadingText = "";
  isLoading = false;
  originalText = "";

  constructor() {
    super();
    this.render();
    this.originalText = this.innerText;
  }

  showLoading(text) {
    if (this.isLoading) {
      return;
    }
    this.isLoading = true;
    this.loadingText = text;
    this.render();
  }

  hideLoading() {
    if (!this.isLoading) {
      return;
    }
    this.isLoading = false;
    this.replaceChildren();
    this.innerText = this.originalText;
  }

  connectedCallback() {}

  render() {
    if (this.isLoading) {
      const spanSpinner = document.createElement("span");
      const spanStatus = document.createElement("span");
      spanSpinner.classList.add("spinner-border", "spinner-border-sm", "me-1");
      spanStatus.role = "status";
      spanStatus.innerText = this.loadingText;
      this.replaceChildren(spanSpinner, spanStatus);
    }
  }
}

customElements.define("rtc-loading-button", LoadingButton, { extends: "button" });
