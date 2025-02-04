import "dotenv/config";
import { ServerOptions } from "ws";
import { Express } from "express";
import expressApp, { setDatabaseProvider } from "@/server";
import startWebSocketApp from "@/server/wss";
import { backupDatabaseCronJob, keepAliveCronJob } from "@/server/cronJobs";
import { DatabaseProviderFactory, DatabaseConfigLoader } from "@/server/db";

process.env.EXPRESS_PORT = process.env.EXPRESS_PORT || undefined;
process.env.WSS_URL = process.env.WSS_URL || undefined;
process.env.JWT_SIGNATURE = process.env.JWT_SIGNATURE || undefined;

if (process.env.EXPRESS_PORT === undefined) {
  throw new Error("[MAIN][ERROR] process.env.EXPRESS_PORT is undefined! It is required to start this server.");
}
if (process.env.JWT_SIGNATURE === undefined) {
  throw new Error("[MAIN][ERROR] process.env.JWT_SIGNATURE is undefined! It is required to start this server.");
}
if (process.env.WSS_URL === undefined) {
  throw new Error("[MAIN][ERROR] Missing WSS_URL env var. Cannot start server.");
}

const databaseConfig = DatabaseConfigLoader.loadConfig(process.env.DATABASE_PROVIDER || "");
console.log(`Using DatabaseProvider : ${databaseConfig.type}`);
const provider = DatabaseProviderFactory.createProvider(databaseConfig);

setDatabaseProvider(provider);

(async (): Promise<void> => {
  try {
    switch (process.env.NODE_ENV) {
      case "production": {
        await provider.restore();
        keepAliveCronJob.start();
        backupDatabaseCronJob(provider.backup).start();
        startExpressAndWebSocketApps(expressApp, startWebSocketApp, provider);
        break;
      }
      case "development": {
        await provider.initialize();
        startExpressAndWebSocketApps(expressApp, startWebSocketApp, provider);
        break;
      }
      case "test": {
        await provider.initialize();
        startExpressAndWebSocketApps(expressApp, startWebSocketApp, provider);
        break;
      }
      default: {
        console.error(`Environment variable "NODE_ENV" must be one of : ("production" | "development" | "test") : Got "${process.env.NODE_ENV}"`);
      }
    }
  } catch (e) {
    console.error(e);
  }
})();

/**
 * Start Express app and WebSocketApp Helpers
 */

export type WebSocketAppStartupFunction = (options: ServerOptions, databaseProvider: DatabaseProvider) => Promise<void>;

async function startExpressAndWebSocketApps(expressApp: Express, startWebSocketAppFn: WebSocketAppStartupFunction, provider: DatabaseProvider): Promise<void> {
  try {
    const server = await expressApp.listenAsync(process.env.EXPRESS_PORT);
    console.log(`Express server listening on '${JSON.stringify(server.address(), null, 2)}'`);
    startWebSocketAppFn({ server }, provider);
    console.log(`WebSocketApp listening via Express server`);
  } catch (e) {
    console.error(e);
  }
}
