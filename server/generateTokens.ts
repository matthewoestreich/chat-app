import { JSONWebToken } from "@root/types.shared";
import jsonwebtoken from "jsonwebtoken";

const EXPIRATION_TIMES = {
  session: "30m",
};

export function generateSessionToken(userName: string, id: string, email: string, options?: jsonwebtoken.SignOptions): JSONWebToken {
  const sessionTokenOptions = { expiresIn: EXPIRATION_TIMES.session, ...options };
  return {
    userName,
    id,
    email,
    signed: jsonwebtoken.sign({ userName, id, email }, process.env.JWT_SIGNATURE || "", sessionTokenOptions),
  };
}
