import jsonwebtoken from "jsonwebtoken";
import RTChatError from "#@/server/errors/RTChatError.js";

function verifyJWTAsync(token, signature) {
  return new Promise((resolve, reject) => {
    jsonwebtoken.verify(token, signature, (err, token) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(token);
    })
  });
}

export default async function (req, res, next) {
  req.jwt = undefined;
  try {
    if (!req.cookies.jwt) {
      next(new RTChatError("missing JWT cookie", 403, 403));
    }
    req.jwt = await verifyJWTAsync(req.cookies.jwt, process.env.JWT_SIGNATURE);
    next();
  } catch (e) {
    next(e);
  }
}
