import { v7 as uuidV7 } from "uuid";
import bcrypt from "bcrypt";
import InMemoryDatabase from "../InMemoryDatabase";

export default class AccountsRepositoryInMemory implements AccountsRepository<InMemoryDatabase> {
  databasePool: DatabasePool<InMemoryDatabase>;

  constructor(dbpool: DatabasePool<InMemoryDatabase>) {
    this.databasePool = dbpool;
  }

  async selectByEmail(email: string): Promise<Account> {
    const { db } = await this.databasePool.getConnection();
    return await db.getOne<Account>((data) => {
      return data.users.find((user) => user.email === email) || ({} as Account);
    });
  }

  getAll(): Promise<Account[]> {
    throw new Error("Method not implemented.");
  }

  getById(_id: string): Promise<Account> {
    throw new Error("Method not implemented.");
  }

  async create(name: string, passwd: string, email: string): Promise<Account> {
    const { db } = await this.databasePool.getConnection();
    const salt = await bcrypt.genSalt(10);
    const hashedPw = await bcrypt.hash(passwd, salt);
    const entity: Account = { id: uuidV7(), name, password: hashedPw, email };
    await db.set((data) => {
      data.users.push({
        id: entity.id,
        name: entity.name,
        email: entity.email,
        password: hashedPw,
      });
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
