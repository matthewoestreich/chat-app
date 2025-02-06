import FileSystemPool from "./FileSystemDatabasePool";
import FileSystemDatabase from "../FileSystemDatabase";
import { DatabasePoolConnection } from "@server/types";

export default class FileSystemPoolConnection implements DatabasePoolConnection<FileSystemDatabase> {
  db: FileSystemDatabase;
  id: string;
  release(): void {
    throw new Error("Method not implemented.");
  }
  constructor(db: FileSystemDatabase, parent: FileSystemPool) {
    this.db = db;
    this.release = (): void => {
      parent.releaseConnection(this);
    };
  }
}
