import { UseCookie } from "@client/types";
import { Cookie } from "@root/types.shared";
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
function getAllCookies(): Cookies {
  const cookies: Cookies = {};
  document.cookie.split("; ").map((cookieStr) => {
    const [name, value] = cookieStr.split("=");
    cookies[decodeURIComponent(name)] = decodeURIComponent(value);
  });
  return cookies;
}

/**
 * Get cookie by name.
 * @param name
 */
function getCookie(name: string): Cookie | undefined {
  return { name, value: getAllCookies()[name] };
}

function clearAllCookies(): void {
  const FORCE_COOKIE_EXPIRATION_PAYLOAD = "; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT";

  document.cookie.split(";").forEach((cookie) => {
    const [name, value] = cookie.split("=");
    if (value === undefined) {
      //
      // As odd as it sounds, if value === undefined it means we were sent a malformed cookie where the name is actually undefined, not the value.
      //
      // Example:
      //  The cookie below actually has no name, but we see it as having one... (created by doing `document.cookie = "fake"` in FireFox console):
      //    console.log(malformedCookie); // -> { name: ' fake', value: undefined }
      //
      // The cookie below legit doesn't have a value. I created a random cookie and removed the value:
      //    console.log(cookieWithoutValue); // -> { name: ' {36b29ec7-423c-4c9a-b644-3b4ddcd7409c}', value: '' }
      //
      // ********* NOTICE *********************************************************************************************************************
      // how the malformed cookie has a value of `undefined` but the cookie without a value has a value of `''`?
      // **************************************************************************************************************************************
      //
      document.cookie = `=${name.trim()}${FORCE_COOKIE_EXPIRATION_PAYLOAD}`;
      return;
    }
    document.cookie = `${name.trim()}=${value.trim()}${FORCE_COOKIE_EXPIRATION_PAYLOAD}`;
  });
}

function clearCookie(name: string, path: string): boolean {
  document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
  if (getCookie(name)) {
    return false;
  }
  return true;
}

export default function useCookies(): UseCookie {
  return {
    setCookie,
    getAllCookies,
    getCookie,
    clearAllCookies,
    clearCookie,
  };
}
