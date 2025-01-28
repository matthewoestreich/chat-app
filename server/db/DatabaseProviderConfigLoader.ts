import appRootPath from "@/appRootPath";

/**
 * **** IMPORTANT****
 * ADD A NEW ENTRY FOR EACH DATABASE PROVIDER!!!
 *
 * =======================================================================================================================
 * Summary of the setup:
 * -----------------------------------------------------------------------------------------------------------------------
 * PROVIDER PARAMS: The `DatabaseProviderConfigRegistry` is used to hold any params your provider may have
 * -----------------------------------------------------------------------------------------------------------------------
 * CONFIG LOADER: Add your providers params as switch case.
 * -----------------------------------------------------------------------------------------------------------------------
 * FACTORY: Where you actually add creating a new instance of your provider, as a switch case.
 * -----------------------------------------------------------------------------------------------------------------------
 * =======================================================================================================================
 *
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
 *
 * Lets say I want to add a new database called `BestDB` that requires
 * a connection string. We would also like to have a limit on max pool connections.
 *
 * !!!!!! NOTE: If your provider requires no params, use `unknown` !!!!
 *
 * Also, the key that you use is how the config loader selects your provider, based upon `process.env.DATABASE_PROVIDER`. So,
 * if you use `bestdb` as the key, when `process.env.DATABASE_PROVIDER === "bestdb"` we will use your database provider.
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
 *
 * Next, add to factory (in DatabaseProviderFactory.ts):
 *
 * ```
 * // In `DatabaseProviderFactory.ts`
 *  private static providerInitializers: DatabaseProviderInitializers = {
 *    sqlite: (config) => new SQLiteProvider(config.databaseFilePath, config.maxConnections),
 *    memory: (_config) => new InMemoryProvider(),
 *    // ADD NEW PROVIDER HERE
 *  };
 * ```
 * =======================================================================================================================
 */

export type DatabaseProviderConfigRegistry = {
  sqlite: {
    databaseFilePath: string;
    maxConnections: number;
  };
  file: {
    jsonFilePath: string;
  };
  memory: {
    seedOnCreation: boolean;
  };
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
      case "file": {
        const jsonFilePath = appRootPath + "/database.json";
        return {
          type: "file",
          config: { jsonFilePath },
        };
      }
      case "memory": {
        return {
          type: "memory",
          config: { seedOnCreation: true },
        };
      }
      default: {
        console.warn(`DATABASE_PROVIDER was not found. Using "in-memory" store. DATA WILL NOT BE SAVED AFTER SERVER IS STOPPED!`);
        return {
          type: "memory",
          config: { seedOnCreation: true },
        };
      }
    }
  }
}
