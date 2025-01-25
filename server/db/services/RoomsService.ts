import { v7 as uuidV7 } from "uuid";

export default class RoomsService<DB> implements IRoomsService<DB> {
  private repository: RoomsRepository<DB>;

  constructor(repo: RoomsRepository<DB>) {
    this.repository = repo;
  }

  selectAll(): Promise<Room[]> {
    return this.repository.getAll();
  }

  selectById(id: string): Promise<Room> {
    return this.repository.getById(id);
  }

  selectByUserId(userId: string): Promise<Room[]> {
    return this.repository.selectByUserId(userId);
  }

  selectUnjoinedRooms(userId: string): Promise<Room[]> {
    return this.repository.selectUnjoinedRooms(userId);
  }

  insert(roomName: string, isPrivate?: 0 | 1): Promise<Room> {
    const privateStatus = isPrivate === undefined ? 0 : isPrivate;
    const room = { id: uuidV7(), name: roomName, isPrivate: privateStatus };
    return this.repository.create(room);
  }

  selectRoomsWithMembersByUserId(userId: string): Promise<RoomWithMembers[]> {
    return this.repository.selectRoomsWithMembersByUserId(userId);
  }

  selectRoomMembersByRoomId(roomId: string): Promise<RoomMember[]> {
    return this.repository.selectRoomMembersByRoomId(roomId);
  }

  selectRoomMembersExcludingUserById(roomId: string, excludingUserId: string): Promise<RoomMember[]> {
    return this.repository.selectRoomMembersExcludingUser(roomId, excludingUserId);
  }

  removeUserFromRoom(userId: string, roomId: string): Promise<boolean> {
    return this.repository.removeUserFromRoom(userId, roomId);
  }

  addUserToRoom(userId: string, roomId: string): Promise<boolean> {
    return this.repository.addUserToRoom(userId, roomId);
  }
}
