import { WebSocketServer } from "ws";
import server from "../server/index.js";
import { v7 as uuidv7 } from "uuid";

process.env.WSS_PORT = process.env.WSS_PORT || 3001;

const wss = new WebSocketServer({ server });

wss.on("connection", handleConnection);

function handleConnection(ws, socket, request) {
	console.log("[wss] connected");
	ws.on("message", (message) => handleMessage(JSON.parse(message), ws));
}

function handleMessage(message, ws) {
	switch (message?.type) {
		case "message": {
			const room = ws.room;
			break;
		}
		case "": {
			if (!message?.displayName) {
				ws.send(JSON.stringify({ ok: false, message: "Missing display name" }));
				break;
			}
			const roomId = uuidv7();
			ws.room = roomId;
			server.ROOMS[roomId] = [{ displayName: message.displayName, socket: ws }];
			ws.send(JSON.stringify({ ok: true, roomId, message: "Room created successfully" }));
			break;
		}
		default: {
			console.log(`[wss][handleMessage] non existent type!`, { type: message?.type });
		}
	}
}
