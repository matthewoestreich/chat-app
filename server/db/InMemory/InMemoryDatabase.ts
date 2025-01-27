import Mutex from "@/server/Mutex";

export interface InMemoryChatTable {
  userId: string;
  roomId: string;
}

export interface InMemoryDatabaseData {
  users: Account[];
  chat: InMemoryChatTable[];
  directConversations: DirectConversation[];
  directMessages: DirectMessage[];
  messages: Message[];
  room: Room[];
  session: Session[];
}

export default class InMemoryDatabase {
  private data: InMemoryDatabaseData;
  private mut: Mutex = new Mutex();

  constructor(data: InMemoryDatabaseData) {
    this.data = data;
  }

  async getOne<T>(query: (data: InMemoryDatabaseData) => T): Promise<T> {
    await this.mut.lock();
    const result = query(this.data);
    this.mut.unlock();
    return result;
  }

  async getMany<T>(query: (data: InMemoryDatabaseData) => T[]): Promise<T[]> {
    await this.mut.lock();
    const result = query(this.data);
    this.mut.unlock();
    return result;
  }

  async set(query: (data: InMemoryDatabaseData) => InMemoryDatabaseData): Promise<void> {
    await this.mut.lock();
    this.data = query(this.data);
    this.mut.unlock();
  }
}
