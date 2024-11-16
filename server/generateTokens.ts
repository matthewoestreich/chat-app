import jsonwebtoken from "jsonwebtoken";

const EXPIRATION_TIMES = {
  session: "30m",
  accessToken: "30m",
  refreshToken: "120m",
};

/**
 *
 * @param {{}} user
 */
export default function generateTokenPair(name: string, id: string, email: string) {
  return {
    accessToken: generateAccessToken(name, id, email),
    refreshToken: generateRefreshToken(name, id, email),
  };
}

export function generateSessionToken(name: string, id: string, email: string) {
  const sessionTokenOptions = { expiresIn: EXPIRATION_TIMES.session };
  return jsonwebtoken.sign({ name, id, email }, process.env.JWT_SIGNATURE || "", sessionTokenOptions);
}

export function generateAccessToken(name: string, id: string, email: string) {
  const accessTokenOptions = { expiresIn: EXPIRATION_TIMES.accessToken };
  return jsonwebtoken.sign({ name, id, email }, process.env.JWT_SIGNATURE || "", accessTokenOptions);
}

export function generateRefreshToken(name: string, id: string, email: string) {
  const refreshTokenOptions = { expiresIn: EXPIRATION_TIMES.refreshToken };
  return jsonwebtoken.sign({ name, id, email }, process.env.JWT_SIGNATURE || "", refreshTokenOptions);
}
