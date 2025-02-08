import appRootPath from "@root/appRootPath";
import { DatabaseProvider } from "../types";
import SQLiteProvider from "./SQLite/SQLiteProvider";

export default class DatabaseProviderFactory {
  static create(name: string): DatabaseProvider<unknown> | null {
    if (name === "sqlite") {
      return new SQLiteProvider(appRootPath + "/rtchat.db", 10);
    }
    return null;
  }
}
