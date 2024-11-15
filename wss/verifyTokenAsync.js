import jsonwebtoken from "jsonwebtoken";

export default function verifyTokenAsync(token, secret) {
  return new Promise((resolve, reject) => {
    jsonwebtoken.verify(token, secret, (err, decoded) => {
      if (err) {
        return reject(err);
      }
      return resolve(decoded);
    });
  });
}
