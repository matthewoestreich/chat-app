import WebSocket, { WebSocketServer } from "ws";
import server from "../server/index.js";

const wss = new WebSocketServer({ server });

wss.on("connection", (ws, socket, request) => {
	ws.on("message", (data) => {
		const message = JSON.parse(data);

		if (!message || !message?.type) {
			console.log(`[ws][on('message')][ERROR] either message or message.type doesn't exit!`, { message, messageType: message?.type });
			return;
		}

		switch (message.type) {
			// Register a socket with already joined user.
			case "register": {
				handleRegister(message, ws);
				break;
			}
			// Handle receiving a message from a client
			case "message": {
				handleChatMessage(message, ws);
				break;
			}
			// TODO: should prob use built-in
			// A "custom", pseudo close.,
			case "close": {
				handleCloseSocket(message);
				break;
			}
			default: {
				console.log(`[wss][handleMessage][ERROR] non existent type!`, { type: message?.type });
			}
		}
	});
});

/**
 *
 * Ensures all required params exist for sending a message.
 * If everything passes, a message is broadcast to all members
 * within the sending members room.
 *
 * @param {{}} message object containing data lol...
 * @param {WebSocketServer<WebSocket.WebSocket>} socket current client socket
 *
 */
function handleChatMessage(message, socket) {
	const { roomId, from, value, userId } = message;
	console.log(`[ws][message]`, { roomId, value, from, userId });

	if (!roomId || !from || !userId || !value || !socket.room || roomId !== socket.room) {
		console.log(` [ws][message][ERROR] missing required param`, { userId, roomId, from, value, "ws.room": socket.room, "roomId !== ws.room": roomId !== socket.room });
		return;
	}
	if (!server.ROOMS[roomId] || !server.ROOMS[roomId][userId]) {
		console.log(` [ws][message][ERROR] either roomm doesn't exist or user not in this room tried sending message!`, { userId, displayName: from });
		socket.close(1007, "Nonexistent room or user!");
		return;
	}

	const chatBubbleColor = server.ROOMS[roomId][userId].chatBubbleColor;
	broadcastToRoom(roomId, userId, { type: "message", from, fromUserId: userId, value, chatBubbleColor });
}

/**
 *
 * When a client first connects to a backend socket, we register this client socket
 * on the backend (for later use).
 *
 * @param {{}} message object containing data lol...
 * @param {WebSocketServer<WebSocket.WebSocket>} socket current client socket
 *
 */
function handleRegister(message, socket) {
	const { roomId, userId, displayName } = message;
	console.log(`[ws][register]`, { roomId, userId, displayName });

	if (!userId || !roomId || !displayName) {
		console.log(` [ws][register][ERROR] missing roomId or userId`, { userId, roomId, displayName });
		return;
	}

	registerSocketToUser(roomId, userId, socket);
	broadcastToRoom(roomId, userId, { type: "join", displayName });
}

/**
 *
 * Removes a user from a room and broadcasts that someone left to the room.
 *
 * @param {{}} message
 *
 */
function handleCloseSocket(message) {
	const { roomId, userId, displayName } = message;
	console.log(`[ws][close]`, { roomId, userId, displayName });

	if (!roomId || !userId || !displayName) {
		console.log(` [ws][close][ERROR] missing required param`, { roomId, userId, displayName });
		return;
	}

	removeUserFromRoom(roomId, userId);
	broadcastToRoom(roomId, userId, { type: "close", displayName });
}

/**
 *
 * If valid data is recieved, deletes entry from server.ROOMS object.
 *
 * @param {UUIDv7} roomId
 * @param {UUIDv7} userId
 *
 */
function removeUserFromRoom(roomId, userId) {
	if (!roomId || !userId || !server.ROOMS[roomId] || !server.ROOMS[roomId][userId]) {
		return;
	}
	console.log(`[ws][remove] removing user from room`, { roomId, userId });
	delete server.ROOMS[roomId][userId];
}

/**
 *
 * Stores a client socket with their user object, which is inside of the rooms object.
 *
 * @param {UUIDv7} roomId
 * @param {UUIDv7} userId
 * @param {WebSocketServer<WebSocket.WebSocket>} socket
 *
 */
function registerSocketToUser(roomId, userId, socket) {
	if (!server.ROOMS[roomId]) {
		return;
	}
	server.ROOMS[roomId][userId] = { socket, ...server.ROOMS[roomId][userId] };
	socket.room = roomId;
}

/**
 *
 * Sends data to every member in specified room.
 *
 * @param {UUIDv7} roomId
 * @param {UUIDv7} userId
 * @param {{}} data any data as an object. eg. `{}`
 *
 */
function broadcastToRoom(roomId, userId, data) {
	const room = server.ROOMS[roomId];
	if (room) {
		for (const [uid, member] of Object.entries(room)) {
			if (member.socket && uid !== userId) {
				member.socket.send(JSON.stringify(data));
			}
		}
	}
}
