import express from "express";
import path from "path";
import { v7 as uuidv7 } from "uuid";

process.env.EXPRESS_PORT = process.env.EXPRESS_PORT || 3000;

const app = express();

/**
 * MISC FUNCTIONS
 */

function getRandomLightColorHex() {
	let color = "#";
	for (let i = 0; i < 6; i++) {
		// Generate a random hex digit (0-F)
		const digit = Math.floor(Math.random() * 16).toString(16);

		// Ensure the color is light by biasing towards higher values (A-F)
		if (Math.random() < 0.5) {
			color += digit;
		} else {
			color += Math.floor(Math.random() * 6 + 10).toString(16); // A-F
		}
	}
	return color;
}

/**
 * VIEW ENGINE
 */

app.set("view engine", "ejs");
app.set("views", path.resolve(import.meta.dirname, "../client"));

/**
 * MIDDLEWARES
 */

// Middleware to parse json bodies
app.use(express.json());

/**
 * ROUTES
 */

app.get("/", (req, res) => {
	res.render("index");
});

app.get("/join", (req, res) => {
	const userId = uuidv7();
	res.render("join-existing-room", { userId });
});

app.get("/create", (req, res) => {
	const roomId = uuidv7();
	const userId = uuidv7();
	// Only create the room here, don't add the user to it.
	// We do that when the user first hits the "/chat/roomId" endpoint.
	// Adding them here would technically be premature.
	req.connection.server.ROOMS[roomId] = {};
	res.render("create-room", { roomId, userId });
});

// url.com/chat/fooRoom?userId=foo&displayName=foo
app.get("/chat/:roomId", (req, res) => {
	const roomId = req.params?.roomId;
	const { userId, displayName } = req.query;

	if (!roomId || !displayName || !userId) {
		console.log(`[/chat][ERROR] missing required param!`, { roomId, displayName, userId });
		res.render("error", { error: "Something went wrong!" });
		return;
	}

	if (roomId === "test") {
		if (!req.connection.server.ROOMS["test"]) {
			req.connection.server.ROOMS["test"] = {};
		}
	}

	if (!req.connection.server.ROOMS[roomId]) {
		console.log(`[/chat][ERROR] room does not exist!`, { roomId });
		res.render("error", { error: "Something went wrong!" });
		return;
	}

	// ~~~ NEED TO TEST THIS ~~
	// If someone tries to join roomId with existing userId
	if (req.connection.server.ROOMS[roomId][userId]) {
		// If the displayName is diff it's prob a duplicate userId...
		if (req.connection.server.ROOMS[roomId][userId].displayName !== displayName) {
			console.log(`[/chat][ERROR] userId and displayName mismatch! Possibly spoofed user.`, { roomId, userId, displayName });
			res.render("error", { error: "Something went wrong!" });
			return;
		}
	}

	req.connection.server.ROOMS[roomId][userId] = {
		chatBubbleColor: getRandomLightColorHex(),
		displayName,
	};

	const members = [];
	for (const [memberId, member] of Object.entries(req.connection.server.ROOMS[roomId])) {
		// We don't need to add ourselves as we already know we exist....
		if (memberId === userId) {
			continue;
		}
		members.push(member.displayName);
	}

	res.render("chat-room", { displayName, roomId, userId, members });
});

app.get("*", (req, res) => {
	res.send("<h1>404 Not Found</h1>");
});

/**
 * START SERVER
 */

const server = app.listen(process.env.EXPRESS_PORT, () => {
	console.log(`Express app listening on port ${process.env.EXPRESS_PORT}!`);
});

server.ROOMS = {};

export default server;
