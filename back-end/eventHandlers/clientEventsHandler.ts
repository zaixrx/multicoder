import { Client, EventHandler } from "./assets/types/socketTypes";
import { Handle } from "./eventsHandlers";

const clientEventsHandler = (
  handle: Handle,
  socket: Client,
): EventHandler => ({
  disconnect: disconnect(handle, socket),
});

const disconnect = (handle: Handle, client: Client) => () => {
  handle.uf.kickClient(client);
};

export default clientEventsHandler;