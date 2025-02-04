import { v7 as uuidV7 } from "uuid";
import FileSystemDatabase from "../FileSystemDatabase";

export default class RoomsMessagesRepositoryFileSystem implements RoomsMessagesRepository<FileSystemDatabase> {
  databasePool: DatabasePool<FileSystemDatabase>;

  constructor(dbpool: DatabasePool<FileSystemDatabase>) {
    this.databasePool = dbpool;
  }

  async selectByRoomId(roomId: string): Promise<Message[]> {
    const { db, release } = await this.databasePool.getConnection();
    const messages = await db.selectManyWhere("messages", (msg) => msg.roomId === roomId);
    const output: Message[] = [];

    for (const msg of messages) {
      const foundUser = (await db.selectOne("users", "id", msg.userId))?.name || "NAME_NOT_FOUND";
      output.push({ ...msg, userName: foundUser });
    }

    release();
    return output;
  }

  getAll(): Promise<Message[]> {
    throw new Error("Method not implemented.");
  }
  getById(_id: string): Promise<Message> {
    throw new Error("Method not implemented.");
  }

  async create(roomId: string, userId: string, message: string): Promise<Message> {
    const { db, release } = await this.databasePool.getConnection();
    const entity: Message = { messageId: uuidV7(), roomId, userId, message, timestamp: new Date(), userName: "" };
    const result = await db.insert("messages", entity);
    release();
    return result!;
  }

  update(_id: string, _entity: Message): Promise<Message | null> {
    throw new Error("Method not implemented.");
  }
  delete(_id: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
}
