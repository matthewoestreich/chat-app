import { v7 as uuidV7 } from "uuid";
import InMemoryDatabase from "../InMemoryDatabase";
import { Message } from "@/types.shared";
import { DatabasePool, RoomsMessagesRepository } from "@server/types";

export default class RoomsMessagesRepositoryInMemory implements RoomsMessagesRepository<InMemoryDatabase> {
  databasePool: DatabasePool<InMemoryDatabase>;

  constructor(dbpool: DatabasePool<InMemoryDatabase>) {
    this.databasePool = dbpool;
  }

  async selectByRoomId(roomId: string): Promise<Message[]> {
    const { db } = await this.databasePool.getConnection();
    return db.getMany<Message>((data) => {
      const messages = data.messages.filter((msg) => msg.scopeId === roomId);
      return messages.map((msg) => ({ ...msg, userName: data.users.find((u) => u.id === msg.userId)?.userName || "NAME_NOT_FOUND" }));
    });
  }

  getAll(): Promise<Message[]> {
    throw new Error("Method not implemented.");
  }
  getById(_id: string): Promise<Message> {
    throw new Error("Method not implemented.");
  }

  async create(roomId: string, userId: string, message: string): Promise<Message> {
    const { db } = await this.databasePool.getConnection();
    const entity: Message = { id: uuidV7(), scopeId: roomId, userId, message, timestamp: new Date() };
    db.set((data) => {
      data.messages.push(entity);
      return data;
    });
    return entity;
  }

  update(_id: string, _entity: Message): Promise<Message | null> {
    throw new Error("Method not implemented.");
  }
  delete(_id: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
}
