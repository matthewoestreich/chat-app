import InMemoryDatabase from "../InMemoryDatabase";
import InMemoryPool from "./InMemoryPool";

export default class InMemoryPoolConnection implements DatabasePoolConnection<InMemoryDatabase> {
  db: InMemoryDatabase;
  id: string;
  release(): void {
    throw new Error("Method not implemented.");
  }
  constructor(db: InMemoryDatabase, parent: InMemoryPool) {
    this.db = db;
    this.release = () => {
      parent.releaseConnection(this);
    };
  }
}
