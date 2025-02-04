import { v7 as uuidV7 } from "uuid";
import InMemoryDatabase from "../InMemoryDatabase";

export default class RoomsRepositoryInMemory implements RoomsRepository<InMemoryDatabase> {
  databasePool: DatabasePool<InMemoryDatabase>;

  constructor(dbpool: DatabasePool<InMemoryDatabase>) {
    this.databasePool = dbpool;
  }

  async selectUnjoinedRooms(userId: string): Promise<IRoom[]> {
    const { db } = await this.databasePool.getConnection();
    return db.getMany<IRoom>((data) => {
      const usersExistingRooms = data.chat.map((c) => {
        if (c.userId === userId) {
          return c.roomId;
        }
      });
      return data.room.filter((r) => !usersExistingRooms.includes(r.id)).sort((a, b) => a.name.localeCompare(b.name));
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

  async selectByUserId(userId: string): Promise<IRoom[]> {
    const { db } = await this.databasePool.getConnection();
    return db.getMany<IRoom>((data) => {
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
      const roomsWithMembers: RoomWithMembers[] = [];
      const roomMembership = data.chat.filter((c) => c.userId === userId);

      roomMembership.forEach((membership) => {
        const room = data.room.find((room) => room.id === membership.roomId);
        const chatRoom = data.chat.filter((r) => r.roomId === membership.roomId);

        const roomWithMembers: RoomWithMembers = { id: room!.id, name: room!.name, members: [] };

        chatRoom.forEach((cr) => {
          const user = data.users.find((u) => cr.userId === u.id);
          if (user) {
            roomWithMembers.members.push({ userId: user!.id, name: user!.name, roomId: room!.id, isActive: false });
          }
        });

        roomsWithMembers.push(roomWithMembers);
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
        roomMembers.push({ name: found!.name, roomId: roomId, userId: found!.id, isActive: false });
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
        roomMembers.push({ name: found!.name, roomId, userId: found!.id, isActive: false });
      });
      return roomMembers;
    });
  }

  getAll(): Promise<IRoom[]> {
    throw new Error("Method not implemented.");
  }

  getById(_id: string): Promise<IRoom> {
    throw new Error("Method not implemented.");
  }

  async create(name: string, isPrivate?: 0 | 1): Promise<IRoom> {
    const { db } = await this.databasePool.getConnection();
    const privateStatus = isPrivate === undefined ? 0 : isPrivate;
    const entity: IRoom = { id: uuidV7(), name, isPrivate: privateStatus };
    db.set((data) => {
      data.room.push(entity);
      return data;
    });
    return entity;
  }

  update(_id: string, _entity: IRoom): Promise<IRoom | null> {
    throw new Error("Method not implemented.");
  }

  delete(_id: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
}
