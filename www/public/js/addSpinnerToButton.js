// Returns a function that once called, revers button back to original state.
function addSpinnerToButton(btnElement, btnText = "") {
  if (btnElement.tagName !== "BUTTON") {
    console.error(`[addSpinnerToButton] btnElement not a button.`);
    return;
  }
  btnElement.setAttribute("data-rtc-spinner-btn", "rtctrue");
  // Make button a spinner for "loading" animation purposes
  btnElement.setAttribute("data-rtc-original-text", btnElement.innerText);
  if (btnText === "") {
    btnText = originalText;
  }
  const spinnerEl = document.createElement("span");
  const statusEl = document.createElement("span");
  spinnerEl.classList.add("spinner-border", "spinner-border-sm", "me-1");
  statusEl.role = "status";
  statusEl.innerText = btnText;
  // Turn button into spinner
  btnElement.replaceChildren(spinnerEl, statusEl);
  return getSpinnerButtonInstance(btnElement);
}

function getSpinnerButtonInstance(btnElement) {
  if (btnElement.tagName !== "BUTTON") {
    console.warn(`[addSpinnerToButton] btnElement not a button.`);
    return;
  }
  if (btnElement.getAttribute("data-rtc-spinner-btn") != "rtctrue") {
    console.warn(`[addSpinnerToButton][getSpinnerButton] provided btnElement not a spinner button.`, btnElement);
    return;
  }
  return () => {
    const ogText = btnElement.getAttribute("data-rtc-original-text");
    btnElement.innerText = ogText;
    btnElement.removeAttribute("data-rtc-spinner-btn");
    btnElement.removeAttribute("data-rtc-original-text");
  };
}
