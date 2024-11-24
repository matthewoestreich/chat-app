// Custom HTML Element for status updates in a callout-like fashion.
//
// - Usage:
//    // Use in DOM like a regular HTML element... (some attributes may not work as expected)
//    <rtc-alert id="alert"></rtc-alert>
//
//    // Target element via JS.
//    const alert = document.getElementById("alert");
//
//    alert.showSuccess("Yay!", "bi-check"); // must be a bootstrap icon
//    --- or ---
//    alert.showWarning(...); // same params as success
//    --- or ---
//    alert.showDanger(...);
//
// - Programmatically hide...
//    alert.hide();
//
class CustomAlert extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const customText = this.getAttribute("customText") || "Default message";
  }

  showSuccess(msg, iconClass = "bi-check") {
    this._render(msg, iconClass, "success");
  }

  showDanger(msg, iconClass = "bi-radioactive") {
    this._render(msg, iconClass, "danger");
  }

  showWarning(msg, iconClass = "bi-exclamation") {
    this._render(msg, iconClass, "warning");
  }

  hide() {
    this.replaceChildren();
  }

  _render(msg, iconClass, alertType = "success") {
    this.innerHTML = `
      <div id="alert-display" class="alert alert-${alertType} d-flex flex-row align-items-center justify-content-between mh-100" role="alert">
        <i class="bi ${iconClass}"></i>
        <div id="alert-message" class="mb-0 max-h-100px overf-scroll">${msg}</div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
  }
}

customElements.define("rtc-alert", CustomAlert);
