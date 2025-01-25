export default class AccountsService<DB> implements IAccountsService<DB> {
  private repository: AccountsRepository<DB>;

  constructor(repo: AccountsRepository<DB>) {
    this.repository = repo;
  }

  insert(entity: Account): Promise<Account> {
    return this.repository.create(entity);
  }

  selectByEmail(email: string): Promise<Account> {
    return this.repository.selectByEmail(email);
  }

  selectById(id: string): Promise<Account> {
    return this.repository.getById(id);
  }
}
