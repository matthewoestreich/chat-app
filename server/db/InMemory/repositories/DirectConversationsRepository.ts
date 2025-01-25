import InMemoryDatabase from "../InMemoryDatabase";

export default class DirectConversationsRepositoryInMemory implements DirectConversationsRepository<InMemoryDatabase> {
  databasePool: DatabasePool<InMemoryDatabase>;

  constructor(dbpool: DatabasePool<InMemoryDatabase>) {
    this.databasePool = dbpool;
  }

  async selectByUserId(userId: string): Promise<DirectConversation[]> {
    const { db } = await this.databasePool.getConnection();
    return db.getMany<DirectConversation>((data) => data.directConversations.filter((dc) => dc.userA_id === userId || dc.userB_id === userId));
  }

  async selectInvitableUsersByUserId(userId: string): Promise<Account[]> {
    // Find people 'userId' isn't already in a direct convo with
    const { db } = await this.databasePool.getConnection();
    return db.getMany<Account>((data) => {
      const union: string[] = [];
      data.directConversations.forEach((dc) => {
        if (dc.userB_id === userId) {
          union.push(dc.userA_id);
        }
        if (dc.userA_id === userId) {
          union.push(dc.userB_id);
        }
      });
      return data.users.filter((user) => user.id !== userId && !union.includes(userId));
    });
  }
  getAll(): Promise<DirectConversation[]> {
    throw new Error("Method not implemented.");
  }
  getById(_id: string): Promise<DirectConversation> {
    throw new Error("Method not implemented.");
  }
  create(_entity: DirectConversation): Promise<DirectConversation> {
    throw new Error("Method not implemented.");
  }
  update(_id: string, _entity: DirectConversation): Promise<DirectConversation | null> {
    throw new Error("Method not implemented.");
  }
  delete(_id: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
}
