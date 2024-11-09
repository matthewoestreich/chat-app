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
		return this.#members.find((m) => m.id === id);
	}

	/**
	 *
	 * @param {RoomMember} member
	 */
	addMember(member) {
		if (!member.id) {
			return;
		}
		this.#members.push(member);
	}

	removeMember(id) {
		const member = this.getMemberById(id);
		if (!member) {
			return;
		}
		member.socket?.close(1000, "removed");
		this.#members.splice(this.#members.indexOf(member), 1);
	}

	// Closes every members socket and resets #members to empty array.
	purge() {
		this.#members.forEach((member) => member.socket?.close(1000, "purge"));
		this.#members = [];
	}
}

// ChatRooms class
export default class ChatRooms {
	#rooms = [];

	/**
	 *
	 * @param {Room[]} rooms
	 */
	constructor(rooms = []) {
		this.#rooms = rooms;
	}

	get(roomId) {
		return this.#rooms.find((r) => r.id === roomId);
	}

	/**
	 *
	 * @param {Room} room
	 */
	add(room) {
		if (!room.id) {
			return;
		}
		// does and existing room have the same id as the room we are trying to add?
		// obviously, we don't want to add it if so...
		const foundRoom = this.get(room.id);
		if (foundRoom && foundRoom.id === room.id) {
			return;
		}
		this.#rooms.push(room);
	}

	// Closes every socket for every member in every room and sets #rooms to an empty array.
	purgeAll() {
		this.#rooms.forEach((room) => room.purge());
		this.#rooms = [];
	}
}
