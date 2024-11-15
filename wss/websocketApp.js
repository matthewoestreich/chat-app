export default function (socket) {
  return new WsApp(socket);
}

/*
Normally, we would do something like:
```
wss.on("connection", (socket, req) => {
  socket.on("message", (message) => {
    const data = JSON.parse(message);
    
    if (data.type === "foo") {
      handleFoo();
    }
    if (data.type === "bar") {
      handleBar();
    }
    
    ...etc
  });
});
```
************** IMPORTANT INFO ****************************************
 - websocketApp fits in after the connection
 - We only process `socket.on("message")` requests, and we expect
the message to be in JSON parsable formatting. 
 - We expect there to be a "type" key on that JSON parsable string.
 - eg. '{ "type": "foo", "more": "data", "can": "go", "here": [1] }'
**********************************************************************

Using the above example, now we can just do:
```
wss.on("connection", (socket, req) => {
  const wsapp = websocketApp(socket);

  wsapp.on("foo", (socket, jsonMessage) => {
    handleFoo();
  });
  wsapp.on("bar", (socket, jsonMessage) => {
    handleBar();
  });

  ...etc
});
```

Can also handle middleware on a "global" level, or every "request" (aka message) level.
Using the above example, now we can just do:
```
wss.on("connection", (socket, req) => {
  const wsapp = websocketApp(socket);
  // Global, only needs to be added once..
  wsapp.useOnce((socket) => attachDbPool(socket)); // or `wsapp.useOnce(attachDbPool);`
  // Runs on each "request".
  wsapp.use((socket) => logSocket(socket)); // or `wsapp.use(logSocket);`
  ...etc
});
```
*/
class WsApp {
  constructor(socket) {
    this.socket = socket;
    this.types = {};
    this.middleware = [];

    socket.on("message", (message) => {
      const data = JSON.parse(message);
      const handler = this.types[data?.type];
      if (!handler) {
        return;
      }
      if (this.middleware.length) {
        this.middleware.forEach((mw) => mw(socket, data));
      }
      if (handler.middleware && handler.middleware.length) {
        handler.middleware.forEach((mw) => mw(socket, data));
      }
      handler.fn(socket, data);
    });
  }

  use(middleware) {
    this.middleware.push(middleware);
  }

  useOnce(middleware) {
    middleware(this.socket);
  }

  /**
   * // middleware = [] of funcs
   * // fn = (socket, data)
   * @param {string} type
   * @param {function(socket, data)[]} middleware
   * @param {function(socket, data)} handler
   */
  on(type, middleware, handler) {
    if (Array.isArray(middleware)) {
      this.types[type] = {
        middleware,
        fn: handler,
      };
    } else {
      this.types[type] = {
        fn: middleware,
      };
    }
  }
}
