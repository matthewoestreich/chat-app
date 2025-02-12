import { Response } from "express";
import { JSONWebToken } from "@root/types.shared";

const ONE_DAY = 24 * 60 * 60 * 1000;

export const MAX_AGE = ONE_DAY;
export const COOKIE_NAME = "session";
export const DEFAULT_COOKIE_OPTIONS = {
  maxAge: MAX_AGE,
  httpOnly: true,
  // Play it safe and force secure cookies if no NODE_ENV is found
  secure: process.env.NODE_ENV === "" || process.env.NODE_ENV === "production" || process.env.NODE_ENV === "render",
};

export default function setSessionCookie(res: Response, token: JSONWebToken): void {
  res.cookie(COOKIE_NAME, token.signed, DEFAULT_COOKIE_OPTIONS);
}
