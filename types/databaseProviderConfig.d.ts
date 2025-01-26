// ADD NEW DATA SOURCES CONFIGS HERE
type ProviderConfigMap = {
  sqlite: {
    databaseFilePath: string;
    maxConnections: number;
  };
  memory: unknown;
};

type ProviderConfig<T extends keyof ProviderConfigMap> = {
  type: T;
  config: ProviderConfigMap[T];
};

type ProviderInitializers = {
  [K in keyof ProviderConfigMap]: (config: ProviderConfigMap[K]) => DatabaseProvider;
};
