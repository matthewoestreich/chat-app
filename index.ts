import "dotenv/config";
import nodePath from "node:path";
import initDatabase from "@/scripts/initDatabase";
import createExpressApp from "./server";
import createWebSocketApp from "./server/wss";
import restoreDatabaeFromGist from "@/scripts/restoreDatabaseFromGist";
import { keepAliveJob, backupDatabaseJob } from "@/scripts/cronJobs";
import SQLitePool from "./server/db/SQLitePool";

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

(async () => await Main())();

async function Main() {
  return new Promise(async (resolve) => {
    try {
      if (process.env.NODE_ENV === "prod") {
        await restoreDatabaeFromGist();
        keepAliveJob.start();
        backupDatabaseJob.start();
      } else {
        process.env.WSS_URL += `:${process.env.EXPRESS_PORT}`;
        if (process.env.NODE_ENV === "dev") {
          await initDatabase(process.env.ABSOLUTE_DB_PATH!);
        }
      }

      const databasePool = new SQLitePool(process.env.ABSOLUTE_DB_PATH!, 5);

      /**
       * Start Express App + WebSocketApp
       */

      // Start Express
      const server = await createExpressApp(databasePool).listenAsync(process.env.EXPRESS_PORT);
      console.log(`Express server listening on '${JSON.stringify(server.address(), null, 2)}'`);
      // Start WebSocketApp
      await createWebSocketApp(databasePool).listenAsync({ server });
      console.log(`WebSocketApp listening via Express server`);

      resolve(null);
    } catch (e) {
      console.log(`[MAIN][ERROR] Error during startup!`, { error: e });
      process.exit(1);
    }
  });
}
