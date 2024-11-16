export function setCookie(name: string, value: string, days: number): string {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  const newCookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  return newCookie;
}
