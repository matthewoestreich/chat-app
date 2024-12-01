// Allows you to reuse a single alert element..Returns a function that lets you hide alert.
// Finds a button with data-bs-dismiss='alert' within alertEl, if found we use it to close alert.
// If showing with icon, we expect it to be a bootstrap-icon as well as an <i> tag to be within your alertEl.

// Expects your html to look like this:
/*
<div id="alertEl" class="alert" role="alert">
  <i class=""></i>
  <div id="messageEl"></div>
    <!-- button is optional, but if it's there it
    MUST have class="btn-close" -->
  <button class="btn-close" type="button"></button>
</div>
*/
function CustomAlert(alertEl, messageEl) {
  this.isShown = false;
  this.alertEl = alertEl;
  this.messageEl = messageEl;
  this.alertIconEl = undefined;
  this.alertType = undefined;
  this.closeButton = alertEl.querySelector("button.btn-close");

  if (this.closeButton) {
    this.closeButton.addEventListener("click", (e) => this.close());
    // Using bootstraps 'bs-dismiss' will completely remove the alert from the DOM.
    // This means we can't reuse it by just adding/removing 'd-none' class. We want to
    // reuse an alert, so we remove that attribute and "close" the alert by adding 'd-none'.
    this.closeButton.removeAttribute("data-bs-dismiss");
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
