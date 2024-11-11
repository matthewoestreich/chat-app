import crypto from "crypto";

/**
 * Sets `res.locals.cspNonce` so you can use it later (like in something like `helmet`).
 */
export default function (req, res, next) {
  res.locals.cspNonce = crypto.randomBytes(32).toString("hex");
  next();
}
