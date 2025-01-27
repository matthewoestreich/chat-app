import { v7 as uuidV7 } from "uuid";
import bcrypt from "bcrypt";
import FileSystemDatabase from "../FileSystemDatabase";

export default class AccountsRepositoryFileSystem implements AccountsRepository<FileSystemDatabase> {
  databasePool: DatabasePool<FileSystemDatabase>;

  constructor(dbpool: DatabasePool<FileSystemDatabase>) {
    this.databasePool = dbpool;
  }

  async selectByEmail(email: string): Promise<Account> {
    const { db, release } = await this.databasePool.getConnection();
    const found = await db.selectOne("users", "email", email);
    release();
    return found || ({} as Account);
  }

  getAll(): Promise<Account[]> {
    throw new Error("Method not implemented.");
  }

  getById(_id: string): Promise<Account> {
    throw new Error("Method not implemented.");
  }

  async create(name: string, passwd: string, email: string): Promise<Account> {
    const { db, release } = await this.databasePool.getConnection();
    const salt = await bcrypt.genSalt(10);
    const hashedPw = await bcrypt.hash(passwd, salt);
    const entity: Account = { id: uuidV7(), name, email, password: hashedPw };
    try {
      await db.insert("users", entity);
      release();
      return entity;
    } catch (e) {
      release();
      throw e;
    }
  }

  update(_id: string, _entity: Account): Promise<Account | null> {
    throw new Error("Method not implemented.");
  }

  delete(_id: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
}
