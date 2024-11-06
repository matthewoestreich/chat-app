import express from "express";
import path from "path";
import { v7 as uuidv7 } from "uuid";

process.env.EXPRESS_PORT = process.env.EXPRESS_PORT || 3000;

const app = express();

/**
 * VIEW ENGINE
 */

app.set('view engine', 'ejs');
app.set('views', path.resolve(import.meta.dirname, "../client"));

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
  res.render("create-room");
});

// url.com/chat/fooRoom?userId=foo&displayName=foo
app.get("/chat/:roomId", (req, res) => {
  const roomId = req.params?.roomId;
  const { userId, displayName } = req.query;
  console.log({roomId, userId, displayName });

  if (!roomId || !displayName) {
    res.render("error", { error: "Something went wrong!" });
    return;
  }

  if (roomId === "test") {
    if (!req.connection.server.ROOMS["test"]) {
      req.connection.server.ROOMS["test"] = {};
    }
  } 
  
  if (!req.connection.server.ROOMS[roomId]) {
    res.render("error", { error: "Something went wrong!" });
    return;
  }

  // If someone tries to join roomId with existing userId
  if (req.connection.server.ROOMS[roomId][userId]) {
    // If the displayName is diff it's prob a duplicate userId...
    if (req.connection.server.ROOMS[roomId][userId].displayName !== displayName) {
      console.log(`[/chat][ERROR] Duplicate userId's in single room!`, { roomId, userId, displayName });
      res.render("error", { error: "Something went wrong!" });
      return 
    }
  }

  req.connection.server.ROOMS[roomId][userId] = { displayName };
  res.render("chat-room", { displayName, roomId, members: req.connection.server.ROOMS[roomId] });
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
