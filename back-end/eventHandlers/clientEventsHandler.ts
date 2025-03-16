import { Messages } from "./assets/types/messageTypes";
import {
  Client,
  EventHandler,
  Handle,
  Request,
} from "./assets/types/socketTypes";

const clientEventsHandler = (handle: Handle, socket: Client): EventHandler => ({
  disconnect: {
    middlewares: [],
    eventHandler: disconnect(handle, socket),
  },
});

const disconnect = (handle: Handle, client: Client) => (_: Request) => {
  const room = handle.app.rooms.get(client.joinedRoom);
  if (room) {
    client.broadcast(Messages.CLIENT_DISCONNECTED);
    room.members.delete(client.id);
    if (room.members.size === 0) {
      handle.app.rooms.delete(room.id);
    }
    client.joinedRoom = "";
  }
  handle.app.clients.delete(client.id);
};

export default clientEventsHandler;
