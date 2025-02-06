import { v7 as uuidV7 } from "uuid";
import FileSystemDatabase from "../FileSystemDatabase";
import { DatabasePool, RoomsRepository } from "@server/types";
import { PublicUser, Room, ChatScopeWithMembers } from "@/types.shared";

export default class RoomsRepositoryFileSystem implements RoomsRepository<FileSystemDatabase> {
  databasePool: DatabasePool<FileSystemDatabase>;

  constructor(dbpool: DatabasePool<FileSystemDatabase>) {
    this.databasePool = dbpool;
  }

  async selectUnjoinedRooms(userId: string): Promise<Room[]> {
    const { db, release } = await this.databasePool.getConnection();
    const usersExistingRooms = (await db.selectManyWhere("chat", (chat) => chat.userId === userId)).map((e) => e.roomId);
    const output = await db.selectManyWhere("room", (r) => !usersExistingRooms.includes(r.id));
    release();
    return output;
  }

  async addUserToRoom(userId: string, roomId: string): Promise<boolean> {
    const { db, release } = await this.databasePool.getConnection();
    const entity = { userId, roomId };
    await db.insert("chat", entity);
    release();
    return true;
  }

  async selectByUserId(userId: string): Promise<Room[]> {
    const { db, release } = await this.databasePool.getConnection();
    const rooms = await db.selectTable("room");
    const filtered: Room[] = [];
    if (!rooms) {
      release();
      return filtered;
    }
    for (const room of rooms) {
      const foundRoom = await db.selectOne("chat", "roomId", room.id);
      const foundUser = await db.selectOne("chat", "userId", userId);
      if (foundRoom && foundUser) {
        filtered.push(room);
      }
    }
    release();
    return filtered;
  }

  async removeUserFromRoom(userId: string, roomId: string): Promise<boolean> {
    const { db, release } = await this.databasePool.getConnection();
    const result = await db.deleteOneWhere("chat", (c) => c.userId === userId && c.roomId === roomId);
    release();
    return result;
  }

  async selectRoomsWithMembersByUserId(userId: string): Promise<ChatScopeWithMembers[]> {
    const { db, release } = await this.databasePool.getConnection();
    const roomsWithMembers: ChatScopeWithMembers[] = [];

    const roomMembership = await db.selectManyWhere("chat", (c) => c.userId === userId);

    for (const membership of roomMembership) {
      const room = await db.selectOneWhere("room", (r) => r.id === membership.roomId);
      const chatRoom = await db.selectManyWhere("chat", (c) => c.roomId === membership.roomId);
      const roomWithMembers: ChatScopeWithMembers = { id: room!.id, name: room!.name, members: [] };

      for (const cRoom of chatRoom) {
        const user = await db.selectOne("users", "id", cRoom.userId);
        if (user) {
          roomWithMembers.members.push({ userId: user!.id, userName: user!.userName, roomId: room!.id, isActive: false });
        }
      }

      roomsWithMembers.push(roomWithMembers);
    }

    release();
    return roomsWithMembers;
  }

  async selectRoomMembersExcludingUser(_roomId: string, _excludingUserId: string): Promise<PublicUser[]> {
    throw new Error("Method not impl");
    //const { db, release } = await this.databasePool.getConnection();
    //const existingMembers = await db.selectManyWhere("chat", (c) => c.roomId === roomId && c.userId === excludingUserId);
    //const roomMembers: RoomMember[] = [];
    //for (const member of existingMembers) {
    //  const found = await db.selectOne("users", "id", member.userId);
    //  roomMembers.push({ userName: found!.name, roomId, userId: found!.id, isActive: false });
    //}
    //release();
    //return roomMembers;
  }

  async selectRoomMembersByRoomId(_roomId: string): Promise<PublicUser[]> {
    throw new Error("Method not impl");
    //const { db, release } = await this.databasePool.getConnection();
    //const existingMembers = (await db.selectMany("chat", "roomId", roomId)) || [];
    //const roomMembers: RoomMember[] = [];
    //for (const member of existingMembers) {
    //  const found = await db.selectOne("users", "id", member.userId);
    //  roomMembers.push({ name: found!.name, roomId, userId: found!.id, isActive: false });
    //}
    //release();
    //return roomMembers;
  }

  getAll(): Promise<Room[]> {
    throw new Error("Method not implemented.");
  }

  getById(_id: string): Promise<Room> {
    throw new Error("Method not implemented.");
  }

  async create(name: string, isPrivate?: 0 | 1): Promise<Room> {
    const { db, release } = await this.databasePool.getConnection();
    const privateStatus = isPrivate === undefined ? 0 : isPrivate;
    const entity: Room = { id: uuidV7(), name, isPrivate: privateStatus };
    await db.insert("room", entity);
    release();
    return entity;
  }

  update(_id: string, _entity: Room): Promise<Room | null> {
    throw new Error("Method not implemented.");
  }

  delete(_id: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
}
