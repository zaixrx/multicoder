import { Socket } from "socket.io";
import { Room } from "./roomTypes";
import { Messages } from "./messageTypes";

export class Client {
  index: number;
  socket: Socket;
  id: string;

  constructor(socket: Socket, index: number) {
    this.index = index;
    this.socket = socket;
    this.id = socket.id.replace('-', '');
  }

  send(message: Messages, ...data: any[]) {
    this.socket.emit(message, ...data);
  }
}

export type EventHandler = {
  [key: string]: (...params: any) => void;
};

export type Appdata = {
  clients: Client[];
  rooms: Room[];
};
