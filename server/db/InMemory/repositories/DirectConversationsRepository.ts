import { v7 as uuidV7 } from "uuid";
import InMemoryDatabase from "../InMemoryDatabase";
import { DirectConversation, PublicDirectConversation, PublicMember } from "@root/types.shared";
import { DatabasePool, DirectConversationsRepository } from "@server/types";

export default class DirectConversationsRepositoryInMemory implements DirectConversationsRepository<InMemoryDatabase> {
  databasePool: DatabasePool<InMemoryDatabase>;

  constructor(dbpool: DatabasePool<InMemoryDatabase>) {
    this.databasePool = dbpool;
  }

  async selectByUserId(userId: string): Promise<PublicDirectConversation[]> {
    const { db } = await this.databasePool.getConnection();
    const directConversations: PublicDirectConversation[] = [];
    return db.getMany<PublicDirectConversation>((data) => {
      const otherUsers: { convoId: string; otherUserId: string }[] = [];
      data.directConversations.forEach((dc) => {
        if (dc.userA_id === userId) {
          otherUsers.push({ convoId: dc.id, otherUserId: dc.userB_id });
        } else if (dc.userB_id === userId) {
          otherUsers.push({ convoId: dc.id, otherUserId: dc.userA_id });
        }
      });
      data.users.forEach((u) => {
        const foundOtherUser = otherUsers.find((otherUser) => u.id === otherUser.otherUserId);
        if (foundOtherUser) {
          directConversations.push({
            id: foundOtherUser.convoId,
            userId: foundOtherUser.otherUserId,
            userName: u.userName,
          });
        }
      });
      return directConversations;
    });
  }

  async selectInvitableUsersByUserId(_userId: string): Promise<PublicMember[]> {
    throw new Error("Method not impl");
    // Find people 'userId' isn't already in a direct convo with
    /*
    const { db } = await this.databasePool.getConnection();
    return db.getMany<PublicUser>((data) => {
      const union: string[] = [];
      data.directConversations.forEach((dc) => {
        if (dc.userB_id === userId) {
          union.push(dc.userA_id);
        }
        if (dc.userA_id === userId) {
          union.push(dc.userB_id);
        }
      });
      return data.users
        .filter((user) => user.id !== userId && !union.includes(userId))
        .map((u) => {
          const { password, email, ...rest } = u;
          return { ...rest, isActive: false };
        });
    });
    */
  }
  getAll(): Promise<DirectConversation[]> {
    throw new Error("Method not implemented.");
  }
  getById(_id: string): Promise<DirectConversation> {
    throw new Error("Method not implemented.");
  }

  async create(userA_id: string, userB_id: string): Promise<DirectConversation> {
    const { db } = await this.databasePool.getConnection();
    const entity: DirectConversation = { id: uuidV7(), userA_id, userB_id };
    db.set((data) => {
      data.directConversations.push(entity);
      return data;
    });
    return entity;
  }

  update(_id: string, _entity: DirectConversation): Promise<DirectConversation | null> {
    throw new Error("Method not implemented.");
  }
  delete(_id: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
}
