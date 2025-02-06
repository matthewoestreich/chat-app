import { v7 as uuidV7 } from "uuid";
import FileSystemDatabase from "../FileSystemDatabase";
import { DirectConversation, PublicDirectConversation, PublicMember } from "@root/types.shared";
import { DatabasePool, DirectConversationsRepository } from "@server/types";

export default class DirectConversationsRepositoryFileSystem implements DirectConversationsRepository<FileSystemDatabase> {
  databasePool: DatabasePool<FileSystemDatabase>;

  constructor(dbpool: DatabasePool<FileSystemDatabase>) {
    this.databasePool = dbpool;
  }

  async selectByUserId(userId: string): Promise<PublicDirectConversation[]> {
    const { db, release } = await this.databasePool.getConnection();
    const directConversations: PublicDirectConversation[] = [];
    const otherUsers: { convoId: string; otherUserId: string }[] = [];

    const dcs = await db.selectTable("directConversations");

    if (dcs) {
      dcs.forEach((dc) => {
        if (dc.userA_id === userId) {
          otherUsers.push({ convoId: dc.id, otherUserId: dc.userB_id });
        } else if (dc.userB_id === userId) {
          otherUsers.push({ convoId: dc.id, otherUserId: dc.userA_id });
        }
      });
    }

    for (const otherUser of otherUsers) {
      const foundOtherUser = await db.selectOne("users", "id", otherUser.otherUserId);
      if (foundOtherUser) {
        directConversations.push({
          id: otherUser.convoId,
          userId: otherUser.otherUserId,
          userName: foundOtherUser.userName,
        });
      }
    }

    release();
    return directConversations;
  }

  async selectInvitableUsersByUserId(_userId: string): Promise<PublicMember[]> {
    throw new Error("Method not impl");
    /*
    const { db, release } = await this.databasePool.getConnection();

    try {
      const dcs = await db.selectTable("directConversations");
      const union: string[] = [];
      if (dcs) {
        dcs.forEach((dc) => {
          if (dc.userB_id === userId) {
            union.push(dc.userA_id);
          }
          if (dc.userA_id === userId) {
            union.push(dc.userB_id);
          }
        });
      }
      const found = await db.selectManyWhere("users", (user) => user.id !== userId && !union.includes(userId));
      const sorted = found.map((u) => {
        const { password, email, ...rest } = u;
        return { ...rest, isActive: false };
      });
      release();
      return sorted;
    } catch (_e) {
      release();
      return [];
    }
    */
  }

  getAll(): Promise<DirectConversation[]> {
    throw new Error("Method not implemented.");
  }
  getById(_id: string): Promise<DirectConversation> {
    throw new Error("Method not implemented.");
  }

  async create(userA_id: string, userB_id: string): Promise<DirectConversation> {
    const { db, release } = await this.databasePool.getConnection();
    const entity: DirectConversation = { id: uuidV7(), userA_id, userB_id };
    try {
      const result = await db.insert("directConversations", entity);
      return result!;
    } catch (_e) {
      release();
      return {} as DirectConversation;
    }
  }

  update(_id: string, _entity: DirectConversation): Promise<DirectConversation | null> {
    throw new Error("Method not implemented.");
  }
  delete(_id: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
}
