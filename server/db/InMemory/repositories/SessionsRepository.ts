import InMemoryDatabase from "../InMemoryDatabase";

export default class SessionsRepositoryInMemory implements SessionsRepository<InMemoryDatabase> {
  databasePool: DatabasePool<InMemoryDatabase>;

  constructor(dbpool: DatabasePool<InMemoryDatabase>) {
    this.databasePool = dbpool;
  }

  async selectByUserId(userId: string): Promise<Session> {
    const { db } = await this.databasePool.getConnection();
    return db.getOne<Session>((data) => data.session.find((s) => s.userId === userId) || ({} as Session));
  }

  async deleteByUserId(userId: string): Promise<boolean> {
    const { db } = await this.databasePool.getConnection();
    let returnValue = true;
    db.set((data) => {
      const index = data.session.findIndex((s) => s.userId === userId);
      if (index === -1) {
        returnValue = false;
        return data;
      }
      data.session.splice(index, 1);
      return data;
    });
    return returnValue;
  }

  async upsert(entity: Session): Promise<boolean> {
    const { db } = await this.databasePool.getConnection();
    let returnValue = true;
    db.set((data) => {
      const index = data.session.findIndex((s) => s.userId === entity.userId && s.token === entity.token);
      if (index === -1) {
        returnValue = false;
        return data;
      }
      data.session[index] = entity;
      return data;
    });
    return returnValue;
  }

  getAll(): Promise<Session[]> {
    throw new Error("Method not implemented.");
  }
  getById(_id: string): Promise<Session> {
    throw new Error("Method not implemented.");
  }

  async create(entity: Session): Promise<Session> {
    const { db } = await this.databasePool.getConnection();
    db.set((data) => {
      data.session.push(entity);
      return data;
    });
    return entity;
  }

  update(_id: string, _entity: Session): Promise<Session | null> {
    throw new Error("Method not implemented.");
  }

  async delete(token: string): Promise<boolean> {
    const { db } = await this.databasePool.getConnection();
    let returnValue = true;
    db.set((data) => {
      const index = data.session.findIndex((s) => s.token === token);
      if (index === -1) {
        returnValue = false;
        return data;
      }
      data.session.splice(index, 1);
      return data;
    });
    return returnValue;
  }
}
