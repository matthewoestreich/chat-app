import express from "express";
import morgan from "morgan";
import path from "path";
import { v7 as uuidv7, validate as uuidValidate, version as uuidVersion } from "uuid";
import ChatRooms, { Room, RoomMember } from "../db/ChatRooms.js";
import apiRouter from "./routers/api/index.js";
import v2Router from "./v2.js";

const app = express();

/**
 * This is how we store room related data
 */
export const CHAT_ROOMS = new ChatRooms();

/**
 * VIEW ENGINE
 */

app.set("view engine", "ejs");
app.set("views", path.resolve(import.meta.dirname, "../client"));

/**
 * MIDDLEWARES
 */

// Logging
morgan.token("body", (req) => req.body && JSON.stringify(req.body));
app.use(morgan(":date[clf] :method :url :status :response-time ms - :res[content-length] :body", { 
  skip: (req, _res) => req.url === "/favicon.ico",
}));

// Middleware to parse json bodies
app.use(express.json());

/**
 * ROUTES
 */

app.use("/api", apiRouter);
app.use("/v2", v2Router);

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
  CHAT_ROOMS.add(new Room(roomId));
  res.render("create-room", { roomId, userId });
});

/**
 * Handles chat room(s)..
 *
 * @route {GET} /chat/:roomId?:userId=_&:displayName=_
 */
app.get("/chat/:roomId", (req, res) => {
  const roomId = req.params?.roomId;
  const { userId, displayName } = req.query;

  if (!roomId || !displayName || !userId) {
    console.log(`[/chat][ERROR] missing required param!`, {
      roomId,
      displayName,
      userId,
    });
    res.render("error", { error: "Something went wrong!" });
    return;
  }
  // Room ID and User ID must be valid UUIDv7
  if (!isValidUUID(roomId, 7) || !isValidUUID(userId, 7)) {
    console.log(`[/chat][ERROR] either roomId or userId isn't valid UUIDv7!`, {
      roomId,
      userId,
    });
    res.render("error", { error: "Something went wrong!" });
    return;
  }

  const existingRoom = CHAT_ROOMS.get(roomId);
  if (!existingRoom) {
    console.log(`[/chat][ERROR] room does not exist!`, { roomId });
    res.render("error", { error: "Something went wrong!" });
    return;
  }

  let member = existingRoom.getMemberById(userId);
  // ~~~ NEED TO TEST THIS ~~ If someone tries to join roomId with existing userId. If (server.ROOMS[roomId][userId]) {
  if (member && member.displayName !== displayName) {
    // If the displayName is diff it's prob a duplicate userId...
    console.log(`[/chat][ERROR] userId and displayName mismatch! Possibly spoofed user.`, { roomId, userId, displayName });
    res.render("error", { error: "Something went wrong!" });
    return;
  }

  if (!member) {
    member = new RoomMember(userId, displayName);
    member.chatBubbleColor = getRandomLightColorHex();
    existingRoom.addMember(member);
  }

  // TODO:
  // I dont really like this being here.. Is it a good idea to pass existing room members this way?
  const members = existingRoom.members.map((m) => {
    if (m.id !== member.id) {
      return m.displayName;
    }
  });

  res.render("chat-room", {
    displayName,
    roomId,
    userId,
    members,
    websocketUrl: process.env.WSS_URL,
  });
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

export default app.listen(process.env.EXPRESS_PORT, () => {
  console.log(`Express app listening on port ${process.env.EXPRESS_PORT}!`);
});

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
