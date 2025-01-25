import { v7 as uuidV7 } from "uuid";

export default class DirectConversationsService<DB> {
  private repository: DirectConversationsRepository<DB>;

  constructor(repo: DirectConversationsRepository<DB>) {
    this.repository = repo;
  }

  selectByUserId(userId: string): Promise<DirectConversation[]> {
    return this.repository.selectByUserId(userId);
  }

  selectInvitableUsersByUserId(userId: string): Promise<Account[]> {
    return this.repository.selectInvitableUsersByUserId(userId);
  }

  insert(userA_id: string, userB_id: string): Promise<DirectConversation> {
    const directConversation: DirectConversation = { id: uuidV7(), userA_id, userB_id };
    return this.repository.create(directConversation);
  }
}
