import { Room } from "./roomConnection";
import { Appdata } from "./socketTypes";

export function getSocket(app: Appdata, socketId: string) {
  return app.sockets.find((socket) => socket.id === socketId);
}

export function getRoom(app: Appdata, roomId: string): Room | undefined {
  return app.rooms.find((room) => room.id.toString() === roomId);
}
