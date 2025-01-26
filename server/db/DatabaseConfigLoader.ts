import nodePath from "node:path";
import appRootPath from "@/appRootPath";

export default class DatabaseConfigLoader {
  static loadConfig(): ProviderConfig<keyof ProviderConfigMap> {
    const databaseProvider = process.env.DATABASE_PROVIDER as keyof ProviderConfigMap;

    switch (databaseProvider) {
      case "sqlite": {
        let databaseFilePath = nodePath.join(appRootPath, "/", "rtchat.db");
        if (process.env.NODE_ENV === "test") {
          databaseFilePath = nodePath.join(appRootPath, "/", "test.db");
        }
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
