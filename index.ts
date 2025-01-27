import "dotenv/config";
import { ServerOptions } from "ws";
import { Express } from "express";
import expressApp, { setDatabaseProvider } from "@/server";
import startWebSocketApp from "@/server/wss";
import { backupDatabaseCronJob, keepAliveCronJob } from "@/cronJobs";
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

const databaseConfig = DatabaseConfigLoader.loadConfig(process.env.DATABASE_PROVIDER || "");
const provider = DatabaseProviderFactory.createProvider(databaseConfig);

setDatabaseProvider(provider);

if (process.env.NODE_ENV === "prod") {
  provider
    .restore()
    .then(() => {
      keepAliveCronJob.start();
      backupDatabaseCronJob(provider.backup).start();
      startExpressAndWebSocketApps(expressApp, startWebSocketApp, provider);
    })
    .catch((e) => console.error(e));
} else if (process.env.NODE_ENV === "dev") {
  provider
    .initialize()
    .then(() => startExpressAndWebSocketApps(expressApp, startWebSocketApp, provider))
    .catch((e) => console.error(e));
}

/**
 * Start Express app and WebSocketApp Helpers
 */

export type WebSocketAppStartupFunction = (options: ServerOptions, databaseProvider: DatabaseProvider) => Promise<void>;

function startExpressAndWebSocketApps(expressApp: Express, startWebSocketAppFn: WebSocketAppStartupFunction, provider: DatabaseProvider): void {
  expressApp
    .listenAsync(process.env.EXPRESS_PORT)
    .then((server) => {
      console.log(`Express server listening on '${JSON.stringify(server.address(), null, 2)}'`);
      startWebSocketAppFn({ server }, provider)
        .then(() => console.log(`WebSocketApp listening via Express server`))
        .catch((e) => console.error(e));
    })
    .catch((e) => console.error(e));
}
