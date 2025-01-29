/**
 * Sets document.cookie
 * @param name
 * @param value
 * @param days
 * @param path
 */
function setCookie(name: string, value: string, days: number, path = "/"): void {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=${path}`;
}

export default function useSetCookie(): (name: string, value: string, days: number, path?: string) => void {
  return setCookie;
}
