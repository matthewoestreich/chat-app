// Allows you to reuse a single alert element..Returns a function that lets you hide alert.
// Finds a button with data-bs-dismiss='alert' within alertEl, if found we use it to close alert.
// If showing with icon, we expect it to be a bootstrap-icon as well as an <i> tag to be within your alertEl.
function CustomAlert(alertEl, messageEl) {
  this.isShown = false;
  this.alertEl = alertEl;
  this.messageEl = messageEl;
  this.alertIconEl = undefined;
  this.alertType = undefined;
  this.closeButton = alertEl.querySelector("button[data-bs-dismiss='alert']");
  if (this.closeButton) {
    this.closeButton.addEventListener("click", this.close);
  }
  this.showWithIcon = function (alertType, message, icon) {
    this.alertIconEl = alertEl.querySelector("i");
    if (this.alertIconEl) {
      this.alertIconEl.removeAttribute("class"); // clear classes before adding.
      this.alertIconEl.classList.add("bi", icon);
      this.messageEl.classList.add("ms-2"); // add margin since there will be an icon there now.
    }
    this.show(alertType, message);
  };
  this.show = function (alertType, message) {
    if (this.isShown) {
      this.messageEl.classList.remove("ms-2"); // remove just in case it exists..
      // If already shown, close existing before showing new.
      this.close();
    }
    this.alertType = `alert-${alertType}`;
    this.alertEl.classList.add(this.alertType);
    this.messageEl.innerText = message;
    this.alertEl.classList.remove("d-none");
    this.isShown = true;
  };
  this.close = function () {
    if (this.closeButton) {
      this.closeButton.removeEventListener("click", this.close);
    }
    this.alertEl.classList.remove(this.alertType);
    this.messageEl.innerText = "";
    this.alertEl.classList.add("d-none");
    this.isShown = false;
  };
}
