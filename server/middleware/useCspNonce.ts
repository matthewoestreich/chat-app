import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

/**
 * Sets `res.locals.cspNonce` so you can use it later (like in something like `helmet`).
 */
export default function (_req: Request, res: Response, next: NextFunction): void {
  res.locals.cspNonce = crypto.randomBytes(32).toString("hex");
  next();
}
