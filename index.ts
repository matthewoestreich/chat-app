import "dotenv/config";
import nodePath from "node:path";
import startExpressApp from "@/server/index";
import startWebSocketApp from "@/server/wss/index";
import initDatabase from "@/scripts/initDatabase";
import restoreDatabaeFromGist from "@/scripts/restoreDatabaseFromGist";
import { keepAliveJob, backupDatabaseJob } from "@/scripts/cronJobs";

process.env.EXPRESS_PORT = process.env.EXPRESS_PORT || "3000";
process.env.WSS_URL = process.env.WSS_URL || "";
process.env.ABSOLUTE_DB_PATH = process.env.ABSOLUTE_DB_PATH || "";
process.env.JWT_SIGNATURE = process.env.JWT_SIGNATURE || "";

if (process.env.NODE_ENV === "test") {
  process.env.ABSOLUTE_DB_PATH = nodePath.resolve(__dirname, "./cypress/db/test.db");
}
if (!process.env.ABSOLUTE_DB_PATH || process.env.ABSOLUTE_DB_PATH === "") {
  console.log("[MAIN][ERROR] missing db path via 'process.env.ABSOLUTE_DB_PATH', unable to resolve it.");
  process.exit(1);
}
if (!process.env.JWT_SIGNATURE) {
  console.log("[MAIN][ERROR] process.env.JWT_SIGNATURE is null! It is required to start this server.");
  process.exit(1);
}
if (!process.env.WSS_URL || process.env.WSS_URL === "") {
  console.error("[MAIN][ERROR] Missing WSS_URL env var. Cannot start server.");
  process.exit(1);
}

const IS_PRODUCTION = process.env.WSS_URL.endsWith("onrender.com");

(async () => await Main())();

async function Main() {
  return new Promise(async (resolve) => {
    try {
      if (IS_PRODUCTION) {
        await restoreDatabaeFromGist();
        // If we are running on Render, start CronJob so our free-tier container isn't spun down due to inactivity.
        keepAliveJob.start();
        backupDatabaseJob.start();
      } else {
        // Add port to wss url if we are running local.
        process.env.WSS_URL += `:${process.env.EXPRESS_PORT}`;
        await initDatabase(process.env.ABSOLUTE_DB_PATH || "");
      }

      /**
       * Start Express App + WebSocketApp
       */

      // Start Express
      const server = await startExpressApp();
      console.log(`Express server listening on '${JSON.stringify(server.address(), null, 2)}'`);

      // Start WebSocketApp
      startWebSocketApp(server, () => {
        console.log(`WebSocketApp listening via Express server`);
      });

      resolve(null);
    } catch (e) {
      console.log(`[MAIN][ERROR] Error during startup!`, { error: e });
      process.exit(1);
    }
  });
}
