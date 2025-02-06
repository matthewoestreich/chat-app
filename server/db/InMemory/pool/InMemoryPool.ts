import { DatabasePool } from "@server/types";
import InMemoryDatabase from "../InMemoryDatabase";
import InMemoryPoolConnection from "./InMemoryPoolConnection";

export default class InMemoryPool implements DatabasePool<InMemoryDatabase> {
  data: InMemoryDatabase;

  constructor(data: InMemoryDatabase) {
    this.data = data;
  }

  getConnection(): Promise<InMemoryPoolConnection> {
    return new Promise((resolve) => resolve(new InMemoryPoolConnection(this.data, this)));
  }

  releaseConnection(_connection: InMemoryPoolConnection): void {
    // noop
  }
}
