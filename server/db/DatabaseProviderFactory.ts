import type { DatabaseProviderConfig, DatabaseProviderConfigRegistry } from "./DatabaseProviderConfigLoader";
import FileSystemProvider from "./FileSystem/FileSystemProvider";
import InMemoryProvider from "./InMemory/InMemoryProvider";
import SQLiteProvider from "./SQLite/SQLiteProvider";

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

export type DatabaseProviderInitializers = {
  [K in keyof DatabaseProviderConfigRegistry]: (config: DatabaseProviderConfigRegistry[K]) => DatabaseProvider;
};

export default class DatabaseProviderFactory {
  /**
   *
   * Add instances of DatabaseProvider implementations here!!
   *
   */
  private static providerInitializers: DatabaseProviderInitializers = {
    sqlite: (config) => new SQLiteProvider(config.databaseFilePath, config.maxConnections),
    file: (config) => new FileSystemProvider(config.jsonFilePath),
    memory: (_config) => new InMemoryProvider(),
  };

  /**
   *
   * Use `DatabaseConfigLoader.loadConfig` and pass the return into this method.
   *
   */
  static createProvider<T extends keyof DatabaseProviderConfigRegistry>(config: DatabaseProviderConfig<T>): DatabaseProvider {
    const initializer = this.providerInitializers[config.type];
    if (!initializer) {
      throw new Error(`Unknown provider type: ${config.type}`);
    }
    return initializer(config.config);
  }
}
