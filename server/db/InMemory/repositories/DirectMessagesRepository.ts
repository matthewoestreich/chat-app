import { DirectMessage } from "@root/types.shared";
import InMemoryDatabase from "../InMemoryDatabase";
import { DatabasePool, DirectMessagesRepository } from "@server/types";

export default class DirectMessagesRepositoryInMemory implements DirectMessagesRepository<InMemoryDatabase> {
  databasePool: DatabasePool<InMemoryDatabase>;

  constructor(dbpool: DatabasePool<InMemoryDatabase>) {
    this.databasePool = dbpool;
  }

  async selectByDirectConversationId(_directConversationId: string): Promise<DirectMessage[]> {
    throw new Error("Method not implemented");
    /*
    const { db } = await this.databasePool.getConnection();
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
    */
  }

  getAll(): Promise<DirectMessage[]> {
    throw new Error("Method not implemented.");
  }
  getById(_id: string): Promise<DirectMessage> {
    throw new Error("Method not implemented.");
  }
  create(_directConversationId: string, _fromUserId: string, _toUserId: string, _message: string): Promise<DirectMessage> {
    throw new Error("Method not implemented.");
  }
  update(_id: string, _entity: DirectMessage): Promise<DirectMessage | null> {
    throw new Error("Method not implemented.");
  }
  delete(_id: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
}
