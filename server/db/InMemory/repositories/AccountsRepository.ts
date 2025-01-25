import InMemoryDatabase from "../InMemoryDatabase";

export default class AccountsRepositoryInMemory implements AccountsRepository<InMemoryDatabase> {
  databasePool: DatabasePool<InMemoryDatabase>;

  constructor(dbpool: DatabasePool<InMemoryDatabase>) {
    this.databasePool = dbpool;
  }

  async selectByEmail(email: string): Promise<Account> {
    const { db } = await this.databasePool.getConnection();
    return db.getOne<Account>((data) => {
      return data.users.find((user) => user.email === email) || ({} as Account);
    });
  }

  getAll(): Promise<Account[]> {
    throw new Error("Method not implemented.");
  }

  getById(_id: string): Promise<Account> {
    throw new Error("Method not implemented.");
  }

  async create(entity: Account): Promise<Account> {
    const { db } = await this.databasePool.getConnection();
    db.set((data) => {
      data.users.push(entity);
      return data;
    });
    return entity;
  }

  update(_id: string, _entity: Account): Promise<Account | null> {
    throw new Error("Method not implemented.");
  }

  delete(_id: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
}
