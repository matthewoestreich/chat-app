import InMemoryDatabase from "../InMemoryDatabase";

export default class RoomsRepositoryInMemory implements RoomsRepository<InMemoryDatabase> {
  databasePool: DatabasePool<InMemoryDatabase>;

  constructor(dbpool: DatabasePool<InMemoryDatabase>) {
    this.databasePool = dbpool;
  }

  async selectUnjoinedRooms(userId: string): Promise<Room[]> {
    const { db } = await this.databasePool.getConnection();
    return db.getMany<Room>((data) => {
      return data.room.filter((r) => {
        const found = data.chat.find((c) => r.id === c.roomId && c.userId === userId);
        if (found) {
          return true;
        }
        return false;
      });
    });
  }

  async addUserToRoom(userId: string, roomId: string): Promise<boolean> {
    const { db } = await this.databasePool.getConnection();
    let returnValue = true;
    db.set((data) => {
      const roomIndex = data.room.findIndex((r) => r.id === roomId);
      const userIndex = data.users.findIndex((u) => u.id === userId);
      if (roomIndex === -1 || userIndex === -1) {
        returnValue = false;
        return data;
      }
      data.chat.push({ userId, roomId });
      return data;
    });
    return returnValue;
  }

  async selectByUserId(userId: string): Promise<Room[]> {
    const { db } = await this.databasePool.getConnection();
    return db.getMany<Room>((data) => {
      return data.room.filter((r) => {
        const foundIndex = data.chat.findIndex((c) => r.id === c.roomId && c.userId === userId);
        if (foundIndex === -1) {
          return false;
        }
        return true;
      });
    });
  }

  async removeUserFromRoom(userId: string, roomId: string): Promise<boolean> {
    const { db } = await this.databasePool.getConnection();
    let returnValue = true;
    db.set((data) => {
      const index = data.chat.findIndex((c) => c.userId === userId && c.roomId === roomId);
      if (index === -1) {
        returnValue = false;
        return data;
      }
      data.chat.splice(index, 1);
      return data;
    });
    return returnValue;
  }

  async selectRoomsWithMembersByUserId(userId: string): Promise<RoomWithMembers[]> {
    const { db } = await this.databasePool.getConnection();
    return db.getMany<RoomWithMembers>((data) => {
      const roomMembership = data.chat.filter((c) => c.userId === userId);

      const roomsWithMembers: RoomWithMembers[] = [];

      roomMembership.forEach((membership) => {
        const room = data.room.find((room) => room.id === membership.roomId);
        const chatRoom = data.chat.filter((r) => r.roomId === membership.roomId);
        const room_and_members: RoomWithMembers = { id: room!.id, name: room!.name, members: [] };
        chatRoom.forEach((cr) => {
          const user = data.users.find((u) => cr.userId === u.id);
          if (user) {
            room_and_members.members.push({ id: user!.id, name: user!.name, roomId: room!.id, isActive: false });
          }
        });
        roomsWithMembers.push(room_and_members);
      });

      return roomsWithMembers;
    });
  }

  async selectRoomMembersExcludingUser(roomId: string, excludingUserId: string): Promise<RoomMember[]> {
    const { db } = await this.databasePool.getConnection();
    return db.getMany<RoomMember>((data) => {
      const existingMembers = data.chat.filter((c) => c.roomId === roomId && c.userId !== excludingUserId);
      const roomMembers: RoomMember[] = [];
      existingMembers.forEach((member) => {
        const found = data.users.find((u) => u.id === member.userId);
        roomMembers.push({ name: found!.name, roomId: roomId, id: found!.id, isActive: false });
      });
      return roomMembers;
    });
  }

  async selectRoomMembersByRoomId(roomId: string): Promise<RoomMember[]> {
    const { db } = await this.databasePool.getConnection();
    return db.getMany<RoomMember>((data) => {
      const existingMembers = data.chat.filter((c) => c.roomId === roomId);
      const roomMembers: RoomMember[] = [];
      existingMembers.forEach((member) => {
        const found = data.users.find((u) => u.id === member.userId);
        roomMembers.push({ name: found!.name, roomId, id: found!.id, isActive: false });
      });
      return roomMembers;
    });
  }

  getAll(): Promise<Room[]> {
    throw new Error("Method not implemented.");
  }

  getById(_id: string): Promise<Room> {
    throw new Error("Method not implemented.");
  }

  create(_name: string, _isPrivate?: 0 | 1): Promise<Room> {
    throw new Error("Method not implemented.");
  }

  update(_id: string, _entity: Room): Promise<Room | null> {
    throw new Error("Method not implemented.");
  }

  delete(_id: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
}
