# chat-app
 Real time chat app built with websockets

### App Flow

 - When a user browses to `/join` a `userId` is created
 - This `userId` is then passed to the `/chat` endpoint


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
