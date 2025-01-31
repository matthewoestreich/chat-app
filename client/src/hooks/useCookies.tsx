export interface Cookie {
  name: string;
  value: string;
}

export interface UseCookie {
  setCookie(name: string, value: string, days: number, path?: string): void;
  getAllCookies(): Cookie[];
  getCookie(name: string): Cookie | undefined;
  clearAllCookies(): void;
  clearCookie(name: string, path: string): boolean;
}

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

/**
 * Gets all cookies name and value
 */
function getAllCookies(): Cookie[] {
  return document.cookie.split("; ").map((cookieStr) => {
    const [name, value] = cookieStr.split("=");
    return {
      name: decodeURIComponent(name),
      value: decodeURIComponent(value),
    };
  });
}

/**
 * Get cookie by name.
 * @param name
 */
function getCookie(name: string): Cookie | undefined {
  return getAllCookies().find((c) => c.name === name);
}

function clearAllCookies(): void {
  document.cookie = "";
}

function clearCookie(name: string, path: string): boolean {
  document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
  if (getCookie(name)) {
    return false;
  }
  return true;
}

export default function useCookie(): UseCookie {
  return {
    setCookie,
    getAllCookies,
    getCookie,
    clearAllCookies,
    clearCookie,
  };
}
