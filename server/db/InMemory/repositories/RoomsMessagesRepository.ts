import InMemoryDatabase from "../InMemoryDatabase";

export default class RoomsMessagesRepositoryInMemory implements RoomsMessagesRepository<InMemoryDatabase> {
  databasePool: DatabasePool<InMemoryDatabase>;

  constructor(dbpool: DatabasePool<InMemoryDatabase>) {
    this.databasePool = dbpool;
  }

  async selectByRoomId(roomId: string): Promise<Message[]> {
    const { db } = await this.databasePool.getConnection();
    return db.getMany<Message>((data) => data.messages.filter((msg) => msg.roomId === roomId));
  }

  getAll(): Promise<Message[]> {
    throw new Error("Method not implemented.");
  }
  getById(_id: string): Promise<Message> {
    throw new Error("Method not implemented.");
  }
  create(_entity: Message): Promise<Message> {
    throw new Error("Method not implemented.");
  }
  update(_id: string, _entity: Message): Promise<Message | null> {
    throw new Error("Method not implemented.");
  }
  delete(_id: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
}
