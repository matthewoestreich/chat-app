export default class DirectMessagesService<DB> implements IDirectMessagesService<DB> {
  private repository: DirectMessagesRepository<DB>;

  constructor(repo: DirectMessagesRepository<DB>) {
    this.repository = repo;
  }

  selectByDirectConversationId(directConversationId: string): Promise<DirectMessage[]> {
    return this.repository.selectByDirectConversationId(directConversationId);
  }
}
