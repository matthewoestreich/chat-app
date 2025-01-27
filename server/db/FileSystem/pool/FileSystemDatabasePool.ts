import FileSystemDatabase from "../FileSystemDatabase";
import FileSystemPoolConnection from "./FileSystemPoolConnection";

export default class FileSystemDatabasePool implements DatabasePool<FileSystemDatabase> {
  private readonly database: FileSystemDatabase;
  private activeConnections: Map<string, FileSystemPoolConnection> = new Map();

  constructor(jsonFilePath: string) {
    this.database = new FileSystemDatabase(jsonFilePath);
  }

  async getConnection(): Promise<FileSystemPoolConnection> {
    const connectionId = crypto.randomUUID();

    const connection: FileSystemPoolConnection = {
      db: this.database,
      id: connectionId,
      release: () => this.releaseConnection(connection),
    };

    this.activeConnections.set(connectionId, connection);
    return connection;
  }

  releaseConnection(connection: FileSystemPoolConnection): void {
    if (this.activeConnections.has(connection.id)) {
      this.activeConnections.delete(connection.id);
    }
  }
}
