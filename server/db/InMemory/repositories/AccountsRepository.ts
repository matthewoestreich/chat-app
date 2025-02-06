import { v7 as uuidV7 } from "uuid";
import bcrypt from "bcrypt";
import InMemoryDatabase from "../InMemoryDatabase";
import { AccountsRepository, DatabasePool } from "@server/types";
import { User } from "@root/types.shared";

export default class AccountsRepositoryInMemory implements AccountsRepository<InMemoryDatabase> {
  databasePool: DatabasePool<InMemoryDatabase>;

  constructor(dbpool: DatabasePool<InMemoryDatabase>) {
    this.databasePool = dbpool;
  }

  async selectByEmail(email: string): Promise<User> {
    const { db } = await this.databasePool.getConnection();
    return await db.getOne<User>((data) => {
      return data.users.find((user) => user.email === email) || ({} as User);
    });
  }

  getAll(): Promise<User[]> {
    throw new Error("Method not implemented.");
  }

  getById(_id: string): Promise<User> {
    throw new Error("Method not implemented.");
  }

  async create(name: string, passwd: string, email: string): Promise<User> {
    const { db } = await this.databasePool.getConnection();
    const salt = await bcrypt.genSalt(10);
    const hashedPw = await bcrypt.hash(passwd, salt);
    const entity: User = { id: uuidV7(), userName: name, password: hashedPw, email };
    await db.set((data) => {
      data.users.push({
        id: entity.id,
        userName: entity.userName,
        email: entity.email,
        password: hashedPw,
      });
      return data;
    });
    return entity;
  }

  update(_id: string, _entity: User): Promise<User | null> {
    throw new Error("Method not implemented.");
  }

  delete(_id: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
}
