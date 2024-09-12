import { Server, Socket } from "socket.io";
import { Appdata, EventHandler } from "./socketTypes";
import roomConnection from "./roomConnection";
import roomCommunication from "./roomCommunication";

const app: Appdata = {
  sockets: [],
  rooms: [],
};

export default (io: Server) => {
  io.on("connection", (currentSocket: Socket) => {
    const handlers: EventHandler[] = [
      roomConnection(app, currentSocket),
      roomCommunication(app, currentSocket),
    ];

    handlers.forEach((handler) => {
      for (const eventName in handler) {
        currentSocket.on(eventName, handler[eventName]);
      }
    });

    const index = app.sockets.length;

    currentSocket.on("disconnect", () => {
      app.sockets.splice(index, 1);
      console.log(currentSocket.id, "left");
      const roomsToDelete: number[] = [];
      app.rooms.forEach((room, index) => {
        const member = room.members.find((m) => m.id === currentSocket.id);
        if (member) {
          room.members.splice(room.members.indexOf(member), 1);
        }
        if (room.members.length === 0) roomsToDelete.push(index);
      });
      roomsToDelete.forEach((roomIndex) => {
        app.rooms.splice(roomIndex, 1);
        console.log("deleted a room");
      });
    });

    app.sockets.push(currentSocket);
    currentSocket.emit("welcomeSent", currentSocket.id);
  });
};
