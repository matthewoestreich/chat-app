import { WebSocketServer } from "ws";
import server from "../server/index.js";

// process.env.WSS_PORT = process.env.WSS_PORT || 3001;

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
			case "message": {
				handleChatMessage(message, ws);
				break;
			}
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

function handleChatMessage(message, socket) {
	const { roomId, from, value, userId } = message;
	console.log(`[ws][message]`, { roomId, value, from, userId });

	if (!roomId || !from || !userId || !value || !socket.room || roomId !== socket.room) {
		console.log(` [ws][message][ERROR] missing required param`, { userId, roomId, from, value, "ws.room": socket.room, "roomId !== ws.room": roomId !== socket.room });
		return;
	}

	if (!server.ROOMS[roomId] || !server.ROOMS[roomId][userId]) {
		console.log(` [ws][message][ERROR] either roomm doesn't exist or user not in this room tried sending message!`, { userId, displayName: from });
		return;
	}

	const chatBubbleColor = server.ROOMS[roomId][userId].chatBubbleColor;
	broadcastToRoom(roomId, userId, { type: "message", from, fromUserId: userId, value, chatBubbleColor });
}

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

function removeUserFromRoom(roomId, userId) {
	delete server.ROOMS[roomId][userId];
}

function registerSocketToUser(roomId, userId, socket) {
	if (!server.ROOMS[roomId]) {
		return;
	}
	server.ROOMS[roomId][userId] = { socket, ...server.ROOMS[roomId][userId] };
	socket.room = roomId;
}

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
