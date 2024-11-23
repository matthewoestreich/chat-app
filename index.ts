import "dotenv/config";
import "./server/wss/index";
import initDatabase from "@/server/db/initDatabase";
import createKeepAliveJob from "@/scripts/keepAlive";

process.env.EXPRESS_PORT = process.env.EXPRESS_PORT || "3000";
process.env.WSS_URL = process.env.WSS_URL || "";
process.env.ABSOLUTE_DB_PATH = process.env.ABSOLUTE_DB_PATH || "";
process.env.JWT_SIGNATURE = process.env.JWT_SIGNATURE || "";

if (!process.env.ABSOLUTE_DB_PATH || process.env.ABSOLUTE_DB_PATH === "") {
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
} else {
  // Start CronJob as keep-alive...
  createKeepAliveJob().start();
}

async function Main() {
  try {
    await initDatabase();
  } catch (e) {
    console.log(`[MAIN][DB][ERROR] Error with database!`, { error: e });
    process.exit(1);
  }
}

(async () => await Main())();
