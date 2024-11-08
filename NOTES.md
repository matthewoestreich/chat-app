Random notes, mostly for myself..

### App Flow

 - Both `userId` and `roomId` must be valid UUID Version 7 

 - When a user browses to `/join` a `userId` is created
 - This `userId` (along with the `roomId` they want to join) is then passed to the `/chat` endpoint

 - When a user browsers to `/create` both a `userID` and `roomID` are created.
 - Both ID's are then passed to `/chat`


### Rooms Schema

```js
ROOMS = {
  "roomid_1": { // <- this is what a room object looks like
    "userID_1": { // <- this is what a user object looks like
      "displayName": "foo",
      "socket": "WebSocket",
      "chatBubbleColor": "<hex_color>",
    },
    "userID_2": {
      "displayName": "bar",
      "socket": "WebSocket",
      "chatBubbleColor": "<hex_color>",
    },
  },
  "roomid_2": {
    // ...etc...
  }
}
```

# Future Schema

```js
const ROOM_SCHEMA = {
	id: "uuidv7",
	displayName: "friendly room name",
	members: [
		/*UserSchema*/
	],
};

const JOINED_ROOM_SCHEMA = {
	roomId: ROOM_SCHEMA.id,
	socket: "WebSocketServer<WebSocket.WebSocket> for this room",
};

const USER_SCHEMA = {
	id: "uuidv7",
	displayName: "friendly user name",
	rooms: [JOINED_ROOM_SCHEMA],
};
```