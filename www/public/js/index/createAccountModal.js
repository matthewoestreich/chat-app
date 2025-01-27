/*
    Script for create-account-modal
    */
const openCreateAccountModal = document.getElementById("open-create-account-modal-btn");
const createAccountModal = document.getElementById("create-account-modal");
const bsCreateAccountModal = bootstrap.Modal.getOrCreateInstance(createAccountModal);
const closeCreateAccountModalBtn = document.getElementById("close-modal-btn");
const form = document.getElementById("form");
const createBtn = document.getElementById("create-btn");
const cancelBtn = document.getElementById("cancel-btn");
const caUnInput = document.getElementById("ca-un-input");
const caEmailInput = document.getElementById("ca-email-input");
const caPwInput = document.getElementById("ca-pw-input");
const statusAlert = new CustomAlert(alertDisplay, alertMessage);

openCreateAccountModal.addEventListener("click", (e) => {
  event.preventDefault();
  event.stopPropagation();
  if (!bsCreateAccountModal._isShown) {
    bsCreateAccountModal.show();
  }
});

createAccountModal.addEventListener("hidden.bs.modal", (event) => {
  // have to remove '.was-validated' from form or else when it's reopened everything is red.
  form.classList.remove("was-validated");
  [caUnInput, caEmailInput, caPwInput].forEach((i) => (i.value = ""));
});

// Create account handler
createBtn.addEventListener("click", async (event) => {
  event.preventDefault();
  event.stopPropagation();

  form.isValid = form.checkValidity();
  form.classList.add("was-validated");

  if (!form.isValid) {
    return;
  }

  // Don't let the user close the modal.
  [createBtn, closeCreateAccountModalBtn, cancelBtn].forEach((e) => (e.disabled = true));
  addSpinnerToButton(createBtn, "Creating account...");

  const accCreationResp = await fetch(`${window.location.origin}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      u: caUnInput.value,
      p: caPwInput.value,
      e: caEmailInput.value,
    }),
  });

  const accCreationResult = await accCreationResp.json();

  // Change button back to normal from spinner/loading animation
  const revert = getSpinnerButtonInstance(createBtn);
  if (revert) {
    revert();
  }
  // Enable btns again.
  [createBtn, closeCreateAccountModalBtn, cancelBtn].forEach((e) => e.removeAttribute("disabled"));
  bsCreateAccountModal.hide();

  // Error. Something went wrong creating account
  if (!accCreationResult.ok) {
    statusAlert.showWithIcon("danger", "Something went wrong when creating account. Please try again.", "bi-exclamation-triangle-fill");
    return;
  }

  statusAlert.showWithIcon("success", "Success! Account created successfully.", "bi-person-fill-check");
  console.log("success!");
});
