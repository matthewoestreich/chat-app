import jsonwebtoken from "jsonwebtoken";

const EXPIRATION_TIMES = {
  accessToken: "15m",
  refreshToken: "24h",
};

/**
 *
 * @param {{}} user
 */
export default function generateTokenPair(name, id, email) {
  return {
    accessToken: generateAccessToken(name, id, email),
    refreshToken: generateRefreshToken(name, id, email),
  };
}

export function generateAccessToken(name, id, email) {
  const accessTokenOptions = { expiresIn: EXPIRATION_TIMES.accessToken };
  return jsonwebtoken.sign({ name, id, email }, process.env.JWT_SIGNATURE, accessTokenOptions);
}

export function generateRefreshToken(name, id, email) {
  const refreshTokenOptions = { expiresIn: EXPIRATION_TIMES.refreshToken };
  return jsonwebtoken.sign({ name, id, email }, process.env.JWT_SIGNATURE, refreshTokenOptions);
}
