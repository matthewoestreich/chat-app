import jsonwebtoken from "jsonwebtoken";

const EXPIRATION_TIMES = {
  session: "30m",
};

export function generateSessionToken(name: string, id: string, email: string, options?: jsonwebtoken.SignOptions) {
  const sessionTokenOptions = { expiresIn: EXPIRATION_TIMES.session, ...options };
  return jsonwebtoken.sign({ name, id, email }, process.env.JWT_SIGNATURE || "", sessionTokenOptions);
}
