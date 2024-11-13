import jsonwebtoken from "jsonwebtoken";

const EXPIRATION_TIMES = {
  accessToken: "1m",
  refreshToken: "90s",
};

/**
 *
 * @param {string} userId
 */
export default function generateTokenPair(userId) {
  return {
    accessToken: generateAccessToken(userId),
    refreshToken: generateRefreshToken(userId),
  };
}

export function generateAccessToken(userId) {
  const rawToken = { id: userId };
  const accessTokenOptions = { expiresIn: EXPIRATION_TIMES.accessToken };
  return jsonwebtoken.sign(rawToken, process.env.JWT_SIGNATURE, accessTokenOptions);
}

export function generateRefreshToken(userId) {
  const rawToken = { id: userId };
  const refreshTokenOptions = { expiresIn: EXPIRATION_TIMES.refreshToken };
  return jsonwebtoken.sign(rawToken, process.env.JWT_SIGNATURE, refreshTokenOptions);
}
