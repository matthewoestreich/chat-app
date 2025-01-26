import InMemoryDatabase from "../InMemoryDatabase";

export default class DirectMessagesRepositoryInMemory implements DirectMessagesRepository<InMemoryDatabase> {
  databasePool: DatabasePool<InMemoryDatabase>;

  constructor(dbpool: DatabasePool<InMemoryDatabase>) {
    this.databasePool = dbpool;
  }

  async selectByDirectConversationId(directConversationId: string): Promise<DirectMessage[]> {
    const { db } = await this.databasePool.getConnection();
    /*
      id: string;
      directConversationId: string;
      fromUserId: string;
      toUserId: string;
      message: string;
      isRead: boolean;
      timestamp: Date;
    */
    const directMessages: DirectMessage[] = [];
    return db.getMany<DirectMessage>((data) => {
      const dms = data.directMessages.filter((dm) => dm.directConversationId === directConversationId);
      dms.forEach((dm) => {
        const foundUser = data.users.find((u) => u.id === dm.fromUserId);
        if (foundUser) {
          directMessages.push({ ...dm, fromUserName: foundUser.name });
        }
      });
      return directMessages;
    });
  }

  getAll(): Promise<DirectMessage[]> {
    throw new Error("Method not implemented.");
  }
  getById(_id: string): Promise<DirectMessage> {
    throw new Error("Method not implemented.");
  }
  create(_entity: DirectMessage): Promise<DirectMessage> {
    throw new Error("Method not implemented.");
  }
  update(_id: string, _entity: DirectMessage): Promise<DirectMessage | null> {
    throw new Error("Method not implemented.");
  }
  delete(_id: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
}
