import appRootPath from "@root/appRootPath";
import { DatabaseProvider } from "../types";
import SQLiteProvider from "./SQLite/SQLiteProvider";
import InMemoryProvider from "./InMemory/InMemoryProvider";
import FileSystemProvider from "./FileSystem/FileSystemProvider";

export default class DatabaseProviderFactory {
  static create(name: string): DatabaseProvider<unknown> | null {
    if (name === "sqlite") {
      return new SQLiteProvider(appRootPath + "/rtchat.db", 10);
    }
    if (name === "file") {
      return new FileSystemProvider(appRootPath + "/database.json");
    }
    if (name === "memory") {
      return new InMemoryProvider(true);
    }
    return null;
  }
}
