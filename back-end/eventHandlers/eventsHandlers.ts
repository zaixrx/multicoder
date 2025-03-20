import { Server, Socket } from "socket.io";
import {
  Appdata,
  EventHandler,
  Client,
  Handle,
  Request,
} from "./assets/types/socketTypes";
import { Room } from "./assets/types/roomTypes";
import roomEventsHandler from "./roomEventsHandler";
import clientEventsHandler from "./clientEventsHandler";
import { Messages } from "./assets/types/messageTypes";

const app: Appdata = {
  clients: new Map<string, Client>(),
  rooms: new Map<string, Room>(),
};

export default (io: Server) => {
  const handle: Handle = { app };

  io.on("connection", (socket: Socket) => {
    const client: Client = new Client(socket);

    const eventsHandlers: EventHandler[] = [
      roomEventsHandler(handle, client),
      clientEventsHandler(handle, client),
    ];

    eventsHandlers.forEach((eventsHandler) => {
      for (const eventName in eventsHandler) {
        const handler = eventsHandler[eventName];

        client.socket.on(eventName, (...params) => {
          try {
            const req: Request = {
              params,
              status: 0,
              state: {
                member: app.rooms
                  .get(client.joinedRoom)
                  ?.members.get(client.id),
              },
            };

            let i = 0;
            while (req.status === 0 && i < handler.middlewares.length) {
              if (handler.options) {
                handler.middlewares[i](handle, client, req, ...handler.options);
              } else {
                handler.middlewares[i](handle, client, req);
              }
              i++;
            }

            if (req.status === 0) {
              handler.eventHandler(req);
            } else {
              client.send(Messages.ERROR, req.state.error);
            }
          } catch (error) {
            console.error(error);
          }
        });
      }
    });

    app.clients.set(client.id, client);
  });
};
