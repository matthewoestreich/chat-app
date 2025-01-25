import { v7 as uuidV7 } from "uuid";

export default class RoomsMessagesService<DB> implements IRoomsMessagesService<DB> {
  private repository: RoomsMessagesRepository<DB>;

  constructor(repo: RoomsMessagesRepository<DB>) {
    this.repository = repo;
  }

  insert(roomId: string, userId: string, message: string, userName?: string): Promise<Message> {
    const newMessage: Message = { id: uuidV7(), userId, roomId, message, userName, timestamp: new Date() };
    return this.repository.create(newMessage);
  }

  selectByRoomId(roomId: string): Promise<Message[]> {
    return this.repository.selectByRoomId(roomId);
  }
}
