import { Server, Socket } from "socket.io";
import { Appdata, EventHandler, Client } from "./assets/types/socketTypes";
import { Room } from "./assets/types/roomTypes";
import roomEventsHandler from "./roomEventsHandler";
import clientEventsHandler from "./clientEventsHandler";
import { Messages } from "./assets/types/messageTypes";

const app: Appdata = {
  clients: [],
  rooms: [],
};

export type Handle = {
  app: Appdata,
  uf: UtilityFunctions,
};

type UtilityFunctions = {
  emitToEveryone: (message: Messages, ...data: any[]) => void,
  emitToClient: (id: string, message: Messages, ...data: any[]) => void,
  getRoom: (roomId: string) => Room | undefined,
  getClient: (id: string) => Client | undefined,
  kickClient: (client: Client) => void,
};

function getUtilityFunctions(io: Server, app: Appdata): UtilityFunctions {
  return {
    emitToEveryone: (message: string, ...data: any[]) => {
      io.emit(message, ...data);
    },
    emitToClient: (id: string, message: Messages, ...data: any[]) => {
      const client = app.clients.find(c => c.id === id);
      if (!client) return;
      
      client.send(message, ...data);
    },    
    getRoom: (roomId: string): Room | undefined => (
      app.rooms.find(r => r.id === roomId)
    ),
    getClient: (id: string): Client | undefined => (
      app.clients.find(c => c.id === id)
    ),
    kickClient: (client: Client) => {
      // TODO: you are probably not updating clients with this information
      app.clients.splice(app.clients.indexOf(client), 1);

      const roomsToDelete: number[] = [];

      app.rooms.forEach((room: Room, index: number) => {
        const member = room.members.find((m) => m.id === client.id);
        if (member) room.members.splice(room.members.indexOf(member), 1);
        
        if (room.members.length === 0) roomsToDelete.push(index);
      });

      roomsToDelete.forEach((roomIndex) => {
        app.rooms.splice(roomIndex, 1);
      });
    },
  }
}

export default (io: Server) => {
  const handle: Handle = { app, uf: getUtilityFunctions(io, app) };

  io.on("connection", (socket: Socket) => {
    console.log("client connected");
    const client: Client = new Client(socket, app.clients.length);

    const handlers: EventHandler[] = [
      roomEventsHandler(handle, client),
      clientEventsHandler(handle, client),
    ];

    handlers.forEach((handler) => {
      for (const eventName in handler) {
        client.socket.on(eventName, handler[eventName]);
      }
    });

    app.clients.push(client);
  });
};
