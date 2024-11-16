import jsonwebtoken, { Secret, PublicKey, GetPublicKeyOrSecret } from "jsonwebtoken";

export default function verifyTokenAsync(token: string, secret: Secret | PublicKey | GetPublicKeyOrSecret) {
  return new Promise((resolve, reject) => {
    jsonwebtoken.verify(token, secret, (err, decoded) => {
      if (err) {
        return reject(err);
      }
      return resolve(decoded);
    });
  });
}
