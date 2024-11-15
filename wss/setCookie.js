function setCookie(name, value, days) {
  console.log({ from: "setCookie", this: this });
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  const newCookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}
