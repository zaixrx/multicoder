const socket: any = {};

const eventsHandlers = [
  eventsHandler("handler", "client"),
  eventsHandler("handler", "client"),
];

eventsHandlers.forEach((eventsHandler) => {
  for (const handlerName in eventsHandler) {
    const handler = eventsHandler.event1;

    socket.on(handler, (req: any) => {
      handler.middlewares.forEach((middleware) => {
        middleware(req);
      });

      if (req.status === 0) {
        handler.handler();
      } else {
        socket.emit("error", req.error);
      }
    });
  }
});

// Events Handler
function roomMiddleware(req: any) {}
function roomMemberMiddleware(req: any) {}
function roomDirectoryNodeMiddlware(req: any) {}

function eventsHandler(handle: any, client: any) {
  return {
    event1: {
      handler: handler1(handle, client),
      middlewares: [roomMiddleware],
    },
    event2: {
      handler: handler2(handle, client),
      middlewares: [roomMiddleware, roomMemberMiddleware],
    },
  };
}

exports = {
  handler: eventsHandler,
};
