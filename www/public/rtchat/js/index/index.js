const mainLoginBtn = document.getElementById("login-btn");
const loginEmailInput = document.getElementById("login-email-input");
const loginPasswordInput = document.getElementById("login-password-input");
const loginForm = document.getElementById("login-form");
const alertDisplay = document.getElementById("alert-display");
const alertMessage = document.getElementById("alert-message");

mainLoginBtn.addEventListener("click", async function (event) {
  event.preventDefault();
  event.stopPropagation();

  addSpinnerToButton(mainLoginBtn, "Logging in...");

  loginForm.isValid = loginForm.checkValidity();
  loginForm.classList.add("was-validated");
  if (!loginForm.isValid) {
    getSpinnerButtonInstance(mainLoginBtn)();
    return;
  }

  const loginResponse = await fetch(`${window.location.origin}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      e: loginEmailInput.value,
      p: loginPasswordInput.value,
    }),
  });

  const revert = getSpinnerButtonInstance(mainLoginBtn)();

  const loginResult = await loginResponse.json();
  if (!loginResponse?.ok) {
    statusAlert.showWithIcon("danger", "Something went wrong!", "bi-exclamation-triangle-fill");
    return;
  }

  setCookie("session", loginResult.session, 1);
  window.location.pathname = "/chat";
});

function setCookie(name, value, days, path = "/") {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=${path}`;
}
