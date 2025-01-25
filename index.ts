import "dotenv/config";
import nodePath from "node:path";
import expressApp, { setDatabaseProvider } from "./server";
import startWebSocketApp from "./server/wss";
import { keepAliveCronJob, backupDatabaseCronJob } from "@/scripts/cronJobs";
import { SQLiteProvider } from "./server/db/providers";

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

(async () => await Main())();

async function Main() {
  return new Promise(async (resolve) => {
    try {
      //if (process.env.NODE_ENV === "prod") {
      //  await restoreDatabaeFromGist();
      //  keepAliveJob.start();
      //  backupDatabaseJob.start();
      //} else if (process.env.NODE_ENV === "dev") {
      //  await initDatabase(DATABASE_PATH.dev);
      //}

      const provider = await configureDatabaseProvider();
      if (provider === undefined) {
        throw new Error(`Unable to configue database provider : '${process.env.DATABASE_PROVIDER}'!`);
      }
      setDatabaseProvider(provider);

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

      resolve(null);
    } catch (e) {
      console.log(`[MAIN][ERROR] Error during startup!`, { error: e });
      process.exit(1);
    }
  });
}

async function configureDatabaseProvider(): Promise<DatabaseProvider | undefined> {
  let provider: DatabaseProvider | undefined = undefined;

  // Just use SQLite if we are testing, for now..
  if (process.env.NODE_ENV === "test") {
    return new SQLiteProvider(nodePath.resolve(__dirname, "./test.db"), 5);
  }

  if (process.env.DATABASE_PROVIDER === "sqlite") {
    if (process.env.NODE_ENV === "prod") {
      provider = new SQLiteProvider(nodePath.resolve(__dirname, "./rtchat.db"), 5);
      await provider.restore();
      backupDatabaseCronJob(provider.backup).start();
    } else if (process.env.NODE_ENV === "dev") {
      provider = new SQLiteProvider(nodePath.resolve(__dirname, "./rtchat.db"), 5);
      await provider.initialize();
    }
  }

  return provider;
}
