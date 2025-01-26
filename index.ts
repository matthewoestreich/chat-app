import "dotenv/config";
import expressApp, { setDatabaseProvider } from "./server";
import startWebSocketApp from "./server/wss";
import { keepAliveCronJob } from "@/scripts/cronJobs";
import { DatabaseProviderFactory, DatabaseConfigLoader } from "@/server/db";

process.env.EXPRESS_PORT = process.env.EXPRESS_PORT || "3000";
process.env.WSS_URL = process.env.WSS_URL || undefined;
process.env.JWT_SIGNATURE = process.env.JWT_SIGNATURE || undefined;
process.env.NODE_ENV = process.env.NODE_ENV || undefined;

if (process.env.NODE_ENV === undefined) {
  throw new Error("[MAIN][ERROR] process.env.NODE_ENV is undefined! It is required to start this server.");
}
if (process.env.JWT_SIGNATURE === undefined) {
  throw new Error("[MAIN][ERROR] process.env.JWT_SIGNATURE is undefined! It is required to start this server.");
}
if (process.env.WSS_URL === undefined) {
  throw new Error("[MAIN][ERROR] Missing WSS_URL env var. Cannot start server.");
}

(async (): Promise<void> => await Main())();

async function Main(): Promise<void> {
  return new Promise(async (resolve) => {
    try {
      //if (process.env.NODE_ENV === "prod") {
      //  await restoreDatabaeFromGist();
      //  keepAliveJob.start();
      //  backupDatabaseJob.start();
      //} else if (process.env.NODE_ENV === "dev") {
      //  await initDatabase(DATABASE_PATH.dev);
      //}

      const databaseConfig = DatabaseConfigLoader.loadConfig();
      const provider = DatabaseProviderFactory.createProvider(databaseConfig);
      setDatabaseProvider(provider);
      console.log({ databaseConfig, provider });

      // Always start keepAliveJob if we are in prod.
      if (process.env.NODE_ENV === "prod") {
        keepAliveCronJob.start();
      }

      /**
       * Start Express App + WebSocketApp
       */

      // Start Express
      const server = await expressApp.listenAsync(process.env.EXPRESS_PORT);
      console.log(`Express server listening on '${JSON.stringify(server.address(), null, 2)}'`);
      // Start WebSocketApp
      await startWebSocketApp({ server }, provider);
      console.log(`WebSocketApp listening via Express server`);

      resolve();
    } catch (e) {
      console.log(`[MAIN][ERROR] Error during startup!`, { error: e });
      process.exit(1);
    }
  });
}
