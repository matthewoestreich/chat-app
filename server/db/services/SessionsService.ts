export default class SessionsService<DB> implements ISessionsService<DB> {
  private repository: SessionsRepository<DB>;

  constructor(repo: SessionsRepository<DB>) {
    this.repository = repo;
  }

  insert(userId: string, token: string): Promise<Session> {
    const session: Session = { userId, token };
    return this.repository.create(session);
  }

  upsert(userId: string, token: string): Promise<boolean> {
    const session: Session = { userId, token };
    return this.repository.upsert(session);
  }

  delete(token: string): Promise<boolean> {
    return this.repository.delete(token);
  }

  deleteByUserId(userId: string): Promise<boolean> {
    return this.repository.deleteByUserId(userId);
  }

  selectByUserId(userId: string): Promise<Session> {
    return this.repository.selectByUserId(userId);
  }
}
