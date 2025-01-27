import FileSystemDatabase from "../FileSystemDatabase";

export default class SessionsRepositoryFileSystem implements SessionsRepository<FileSystemDatabase> {
  databasePool: DatabasePool<FileSystemDatabase>;

  constructor(dbpool: DatabasePool<FileSystemDatabase>) {
    this.databasePool = dbpool;
  }

  async selectByUserId(userId: string): Promise<Session | undefined> {
    const { db, release } = await this.databasePool.getConnection();
    const found = await db.selectOne("session", "userId", userId);
    release();
    return found;
  }

  async deleteByUserId(userId: string): Promise<boolean> {
    const { db, release } = await this.databasePool.getConnection();
    const result = await db.deleteOneWhere("session", (s) => s.userId === userId);
    release();
    return result;
  }

  async upsert(userId: string, token: string): Promise<boolean> {
    const { db, release } = await this.databasePool.getConnection();
    const exists = await db.selectOne("session", "userId", userId);
    if (exists) {
      await db.setOne("session", "userId", userId, "token", token);
      release();
      return true;
    }
    await db.insert("session", { userId, token });
    release();
    return true;
  }

  getAll(): Promise<Session[]> {
    throw new Error("Method not implemented.");
  }
  getById(_id: string): Promise<Session> {
    throw new Error("Method not implemented.");
  }

  async create(userId: string, sessionToken: string): Promise<Session> {
    const { db, release } = await this.databasePool.getConnection();
    const existing = await db.selectOne("session", "userId", userId);
    if (existing) {
      await db.setOne("session", "userId", userId, "token", sessionToken);
      release();
      return { userId, token: sessionToken };
    }
    const result = await db.insert("session", { userId, token: sessionToken });
    release();
    return result!;
  }

  update(_id: string, _entity: Session): Promise<Session | null> {
    throw new Error("Method not implemented.");
  }

  async delete(token: string): Promise<boolean> {
    const { db, release } = await this.databasePool.getConnection();
    const result = await db.deleteOneWhere("session", (s) => s.token === token);
    release();
    return result;
  }
}
