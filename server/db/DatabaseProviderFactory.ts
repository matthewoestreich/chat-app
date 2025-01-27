import type { DatabaseProviderConfig, DatabaseProviderConfigRegistry } from "./DatabaseProviderConfigLoader";
import InMemoryProvider from "./InMemory/InMemoryProvider";
import SQLiteProvider from "./SQLite/SQLiteProvider";

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
