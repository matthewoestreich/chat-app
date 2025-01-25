import InMemoryDatabase from "../InMemoryDatabase";

export default class DirectMessagesRepositoryInMemory implements DirectMessagesRepository<InMemoryDatabase> {
  databasePool: DatabasePool<InMemoryDatabase>;

  constructor(dbpool: DatabasePool<InMemoryDatabase>) {
    this.databasePool = dbpool;
  }

  async selectByDirectConversationId(directConversationId: string): Promise<DirectMessage[]> {
    const { db } = await this.databasePool.getConnection();
    return db.getMany<DirectMessage>((data) => data.directMessages.filter((dm) => dm.directConversationId === directConversationId));
  }
  getAll(): Promise<DirectMessage[]> {
    throw new Error("Method not implemented.");
  }
  getById(_id: string): Promise<DirectMessage> {
    throw new Error("Method not implemented.");
  }
  create(_entity: DirectMessage): Promise<DirectMessage> {
    throw new Error("Method not implemented.");
  }
  update(_id: string, _entity: DirectMessage): Promise<DirectMessage | null> {
    throw new Error("Method not implemented.");
  }
  delete(_id: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
}
