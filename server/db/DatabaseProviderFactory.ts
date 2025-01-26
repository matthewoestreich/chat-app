import InMemoryProvider from "./InMemory/InMemoryProvider";
import SQLiteProvider from "./SQLite/SQLiteProvider";

export default class DatabaseProviderFactory {
  /**
   *
   * Add instances of DatabaseProvider implementations here!!
   *
   */
  private static providerInitializers: ProviderInitializers = {
    sqlite: (config) => new SQLiteProvider(config.databaseFilePath, config.maxConnections),
    memory: () => new InMemoryProvider(),
  };

  /**
   *
   * Use `DatabaseConfigLoader.loadConfig` and pass the return into this method.
   *
   */
  static createProvider<T extends keyof ProviderConfigMap>(config: ProviderConfig<T>): DatabaseProvider {
    const initializer = this.providerInitializers[config.type];
    if (!initializer) {
      throw new Error(`Unknown provider type: ${config.type}`);
    }
    return initializer(config.config);
  }
}
