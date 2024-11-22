import "dotenv/config";
import "./server/wss/index";
import path from "path";
import initDatabase from "./server/db/initDatabase";
import getDatabaseTables from "./server/db/getDatabaseTables";

process.env.EXPRESS_PORT = process.env.EXPRESS_PORT || "3000";
process.env.WSS_URL = process.env.WSS_URL || "";
process.env.ABSOLUTE_DB_PATH = process.env.ABSOLUTE_DB_PATH || path.resolve(__dirname, "./tmp/rtchat");
process.env.JWT_SIGNATURE = process.env.JWT_SIGNATURE || "";

if (!process.env.ABSOLUTE_DB_PATH) {
  console.log("missing db path via 'process.env.ABSOLUTE_DB_PATH', unable to resolve it.");
  process.exit(1);
}
if (!process.env.JWT_SIGNATURE) {
  console.log("[MAIN][ERROR] process.env.JWT_SIGNATURE is null! It is required to start this server.");
  process.exit(1);
}
if (process.env.WSS_URL !== "" && !process.env.WSS_URL.endsWith("onrender.com")) {
  // Add port to wss url if we are running local.
  process.env.WSS_URL += `:${process.env.EXPRESS_PORT}`;
}

initDatabase()
  .then(() => console.log("[MAIN][DB][INITIALIZED] at:", process.env.ABSOLUTE_DB_PATH))
  .catch((e) => {
    console.log(`[MAIN][DB][ERROR] Error with database!`, { error: e });
    process.exit(1);
  });

getDatabaseTables()
  .then((tables) => console.log(tables))
  .catch((e) => console.error(e));
