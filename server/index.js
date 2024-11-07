import express from "express";
import path from "path";
import { v7 as uuidv7, validate as uuidValidate, version as uuidVersion } from "uuid";

process.env.EXPRESS_PORT = process.env.EXPRESS_PORT || 3000;

const app = express();

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

/**
 * @route {GET} /
 */
app.get("/", (req, res) => {
	res.render("index");
});

/**
 * @route {GET} /join
 */
app.get("/join", (req, res) => {
	const userId = uuidv7();
	res.render("join-existing-room", { userId });
});

/**
 * @route {GET} /create
 */
app.get("/create", (req, res) => {
	const roomId = uuidv7();
	const userId = uuidv7();
	// Only create the room here, don't add the user to it yet. We will add
	// the user to the room when the user first hits the "/chat/:roomId" endpoint.
	// Adding them here would technically be premature.
	req.connection.server.ROOMS[roomId] = {};
	res.render("create-room", { roomId, userId });
});

/**
 * Handles chat room(s)..
 *
 * @route {GET} /chat:roomId?:userId=_&:displayName=_
 */
app.get("/chat/:roomId", (req, res) => {
	const roomId = req.params?.roomId;
	const { userId, displayName } = req.query;

	if (!roomId || !displayName || !userId) {
		console.log(`[/chat][ERROR] missing required param!`, { roomId, displayName, userId });
		res.render("error", { error: "Something went wrong!" });
		return;
	}
	// Room ID and User ID must be valid UUIDv7
	if (!isValidUUID(roomId, 7) || !isValidUUID(userId, 7)) {
		console.log(`[/chat][ERROR] either roomId or userId isn't valid UUIDv7!`, { roomId, userId });
		res.render("error", { error: "Something went wrong!" });
		return;
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

	// TODO:
	// I dont really like this being here..
	// Maybe find a better way of informing the user of current membersin room?
	// Since the user will "register" with wss after this page is rendered, that
	// may be a good place to do so?
	const members = [];
	for (const [memberId, member] of Object.entries(req.connection.server.ROOMS[roomId])) {
		// We don't need to add ourselves as we already know we exist....
		if (memberId === userId) {
			continue;
		}
		members.push(member.displayName);
	}

	// Hack to get websocket url correctly..Must use 'wss' while on Render.com and 'ws' locally ...
	let websocketUrl = `ws://localhost:${process.env.EXPRESS_PORT}`;
	if (process.env.IS_RUNNING_LOCAL === "no") {
		websocketUrl = `wss://${process.env.HOST_NAME}`;
	}

	res.render("chat-room", { displayName, roomId, userId, members, websocketUrl });
});

/**
 * 404 route
 * @route {GET} *
 */
app.get("*", (req, res) => {
	res.send("<h1>404 Not Found</h1>");
});

/**
 * START SERVER
 */

const server = app.listen(process.env.EXPRESS_PORT, () => {
	console.log(`Express app listening on port ${process.env.EXPRESS_PORT}!`);
});

/**
 * This is how we store room related data so it is accessible via wss,
 * express routes, and any other file that wants to import our server.
 */
server.ROOMS = {};
export default server;

/**
 * MISC FUNCTIONS
 */

/**
 *
 * Validates UUID format and optionally it's version
 *
 * @param {string} uuid
 * @param {*} expectedVersion
 *
 */
function isValidUUID(uuid, expectedVersion = null) {
	const isGoodUUID = uuidValidate(uuid);
	if (expectedVersion && parseInt(expectedVersion) !== NaN) {
		return isGoodUUID && uuidVersion(uuid) === parseInt(expectedVersion);
	}
	return isGoodUUID;
}

/**
 *
 * Gets a random light color in hex format.
 * We ensure the color is light by having a bias towards colors
 * that contain values in the `A-F` range.
 *
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
