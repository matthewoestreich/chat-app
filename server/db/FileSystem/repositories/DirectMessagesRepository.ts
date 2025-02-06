import { DatabasePool, DirectMessagesRepository } from "@server/types";
import FileSystemDatabase from "../FileSystemDatabase";
import { DirectMessage } from "@/types.shared";

export default class DirectMessagesRepositoryFileSystem implements DirectMessagesRepository<FileSystemDatabase> {
  databasePool: DatabasePool<FileSystemDatabase>;

  constructor(dbpool: DatabasePool<FileSystemDatabase>) {
    this.databasePool = dbpool;
  }

  async selectByDirectConversationId(_directConversationId: string): Promise<DirectMessage[]> {
    throw new Error("Method not impl");
    //const { db, release } = await this.databasePool.getConnection();
    //const directMessages: DirectMessage[] = [];
    //const dms = await db.selectManyWhere("directMessages", (dm) => dm.directConversationId === directConversationId);
    //for (const dm of dms) {
    //  const foundUser = await db.selectOne("users", "id", dm.fromUserId);
    //  if (foundUser) {
    //    directMessages.push({ ...dm, fromUserName: foundUser.name });
    //  }
    //}
    //release();
    //return directMessages;
  }

  getAll(): Promise<DirectMessage[]> {
    throw new Error("Method not implemented.");
  }
  getById(_id: string): Promise<DirectMessage> {
    throw new Error("Method not implemented.");
  }
  create(): Promise<DirectMessage> {
    throw new Error("Method not implemented.");
  }
  update(_id: string, _entity: DirectMessage): Promise<DirectMessage | null> {
    throw new Error("Method not implemented.");
  }
  delete(_id: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
}
