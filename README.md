# chat-app
 Real time chat app built with websockets


```js
ROOMS = {
  "roomid_1": { // <- this is what a room object looks like
    "userID_1": { // <- this is what a user object looks like
      "displayName": "foo",
      "socket": "WebSocket"
    },
    "userID_2": {
      "displayName": "bar",
      "socket": "WebSocket"
    },
  },
  "roomid_2": {
    // ...etc...
  }
}
```