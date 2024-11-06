# chat-app
 Real time chat app built with websockets


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
