import { Request, Response } from "express";

export default function clearAllCookies(req: Request, res: Response): void {
  const FORCE_COOKIE_EXPIRATION_PAYLOAD = "; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT";

  if (req.headers.cookie) {
    // prettier-ignore
    res.setHeader("Set-Cookie", req.headers.cookie.split(";").map((cookie) => {
        const [name, value] = cookie.split("=");
        if (value === undefined) {
          //
          // As odd as it sounds, if value === undefined it means we were sent a malformed cookie where the name
          // is actually undefined, not the value.
          //
          // Example:
          //  The cookie below actually has no name, but we see it as having one. (created by doing `document.cookie = "fake"`):
          //    console.log(malformedCookie); // -> { name: ' fake', value: undefined }
          //
          // The cookie below legit doesn't have a value. I created a random cookie and removed the value:
          //    console.log(cookieWithoutValue); // -> { name: ' {36b29ec7-423c-4c9a-b644-3b4ddcd7409c}', value: '' }
          //
          // ********* NOTICE ******************************************************************************************
          // how the malformed cookie has a value of `undefined` but the cookie without a value has a value of `''`?
          // ***********************************************************************************************************
          //
          return `=${name.trim()}${FORCE_COOKIE_EXPIRATION_PAYLOAD}`;
        }
        return `${name.trim()}=${value.trim()}${FORCE_COOKIE_EXPIRATION_PAYLOAD}`;
      }),
    );
  }
}
