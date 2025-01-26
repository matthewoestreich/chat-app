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

  constructor(data: InMemoryDatabaseData) {
    this.data = data;
  }

  getOne<T>(query: (data: InMemoryDatabaseData) => T): T {
    return query(this.data);
  }

  getMany<T>(query: (data: InMemoryDatabaseData) => T[]): T[] {
    return query(this.data);
  }

  set(query: (data: InMemoryDatabaseData) => InMemoryDatabaseData): void {
    this.data = query(this.data);
  }
}
