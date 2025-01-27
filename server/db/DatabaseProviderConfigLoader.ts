import nodePath from "node:path";
import appRootPath from "@/appRootPath";

/**
 *
 *
 * **** IMPORTANT****
 * ADD A NEW ENTRY FOR EACH DATABASE PROVIDER!!!
 *
 * =======================================================================================================================
 * -----------------------------------------------------------------------------------------------------------------------
 * - An Entry Requires Two Things -
 * -----------------------------------------------------------------------------------------------------------------------
 *  1. (key) Name of provider
 *  2. (object) Parameters that are passed to `new YourConfigProvider(<params>)`. The
 *     keys in the parameters object that you provide MUST MATCH THE PARAMETER
 *     NAMES ON THE CLASS/FUNCTION/METHOD THAT CREATES YOUR PROVIDER!
 * =======================================================================================================================
 *
 *
 * =======================================================================================================================
 * -----------------------------------------------------------------------------------------------------------------------
 * - Example of a New Provider -
 * -----------------------------------------------------------------------------------------------------------------------
 * Lets say I want to add a new database called `BestDB` that requires
 * a connection string. We would also like to have a limit on max pool connections.
 * !!!!!! NOTE: If your provider requires no params, use `unknown` !!!!
 *
 * ```
 * export type DatabaseProviderConfigRegistry = {
 *    // other providers removed for brevity
 *    bestdb: {
 *      connectionString: string;
 *      maxConnections: number;
 *    },
 *    // !!!!!! NOTE: If your provider requires no params, use `unknown` !!!!
 *    otherProvider: unknown;
 * }
 * ```
 * =======================================================================================================================
 *
 */
export type DatabaseProviderConfigRegistry = {
  sqlite: {
    databaseFilePath: string;
    maxConnections: number;
  };
  memory: unknown;
};

export type DatabaseProviderConfig<T extends keyof DatabaseProviderConfigRegistry> = {
  type: T;
  config: DatabaseProviderConfigRegistry[T];
};

export default class DatabaseProviderConfigLoader {
  static loadConfig(databaseProvider: string): DatabaseProviderConfig<keyof DatabaseProviderConfigRegistry> {
    switch (databaseProvider) {
      /**
       *
       * **** IMPORTANT****
       *
       * ADD A NEW CASE FOR EACH DATABASE PROVIDER!!!
       * YOU ALSO NEED TO ADD AN ENTRY IN DatabaseProviderConfigRegistry (above).
       *
       * Read notes above for detailed info.
       */
      case "sqlite": {
        const databaseFilePath = process.env.NODE_ENV === "test" ? appRootPath + "/test.db" : appRootPath + "/rtchat.db";

        return {
          type: "sqlite",
          config: { databaseFilePath, maxConnections: 5 },
        };
      }
      case "memory": {
        console.log({ in: "DatabaseConfigLoader.ts", provider: "memory" });
        return {
          type: "memory",
          config: {},
        };
      }
      default: {
        console.warn(`DATABASE_PROVIDER was not found. Using "in-memory" store. DATA WILL NOT BE SAVED AFTER SERVER IS STOPPED!`);
        return {
          type: "memory",
          config: {},
        };
      }
    }
  }
}
