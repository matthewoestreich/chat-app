// THIS MUST BE AT THE TOP! ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
import path from "path";
process.env.ABSOLUTE_DB_PATH = path.resolve(__dirname, "./server/db/rtchat.db") || "";
console.log(process.env.ABSOLUTE_DB_PATH);
if (process.env.ABSOLUTE_DB_PATH === "") {
  console.log("missing db path, unable to resolve it.");
  process.exit(1);
} else {
  console.log({ absoluteDbPath: process.env.ABSOLUTE_DB_PATH });
}
// ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~

import "dotenv/config";
import "./server/wss/index.js";
import initDatabase from "./server/db/initDatabase.js";

if (!process.env.JWT_SIGNATURE) {
  console.log("[MAIN][ERROR] process.env.JWT_SIGNATURE is null! It is required to start this server.");
  process.exit(1);
}

initDatabase().catch((e) => {
  console.log(`[MAIN][DB][ERROR] Error with database!`, { error: e });
  process.exit(1);
});

process.env.EXPRESS_PORT = process.env.EXPRESS_PORT || "3000";
process.env.WSS_URL = process.env.WSS_URL || "";

if (!process.env.WSS_URL.endsWith("onrender.com")) {
  // Add port to wss url if we are running local.
  process.env.WSS_URL += `:${process.env.EXPRESS_PORT}`;
}
