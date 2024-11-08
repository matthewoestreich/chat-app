export class RoomMember {
  #id = undefined;
  #displayName = undefined;

  constructor(id, displayName) {
    this.#id = id;
    this.#displayName = displayName;
    this.chatBubbleColor = undefined;
    this.socket = undefined;
  }

  get id() {
    return this.#id;
  }
  get displayName() {
    return this.#displayName;
  }
}

/**
 * Room ID is auto generated
 */
export class Room {
  #id = undefined;
  #displayName = undefined;
  /** @type {RoomMember[]} */
  #members = [];

  /**
   * 
   * @param {string} id 
   * @param {string} displayName
   */
  constructor(id, displayName) {
    this.#id = id;
    this.#displayName = displayName;
  }

  get id() {
    return this.#id;
  }
  get displayName() {
    return this.#displayName;
  }
  get members() {
    return this.#members;
  }

  /**
   * 
   * @param {*} id 
   * @returns {RoomMember}
   */
  getMemberById(id) {
    return this.#members.find(m => m.id === id);
  }

  /**
   * 
   * @param {RoomMember} member 
   */
  addMember(member) {
    if (!member.id) {
      console.log(`[ERROR][addMember] member id is required! member id is missing!`);
      return;
    }
    this.#members.push(member);
  }

  removeMember(id) {
    const index = this.#members.indexOf(this.getMemberById(id));
    this.#members.splice(index, 1);
  }
}

// ChatRooms class
export default class ChatRooms {
  /**
   * 
   * @param {Room[]} rooms 
   */
  constructor(rooms = []) {
    this.rooms = rooms;
  }

  get(roomId) {
    return this.rooms.find(r => r.id === roomId);
  }

  /**
   * 
   * @param {Room} room 
   */
  add(room) {
    if (!room.id) {
      console.log(`[ERROR][add] room id is missing! room id is required!`);
      return;
    }
    const foundRoom = this.get(room.id);
    if (foundRoom && foundRoom.id === room.id) {
      console.log(`[ERROR][add] room with that id already exists!`);
      return;
    }
    this.rooms.push(room);
  }
}