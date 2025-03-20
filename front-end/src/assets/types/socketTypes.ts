import { Socket } from "socket.io-client";
import { Room } from "./roomTypes";
import { Messages } from "./messageTypes";

export class Client {
  public id: string;
  public socket: Socket;

  constructor(socket: Socket) {
    this.socket = socket;
    this.id = socket.id || "";
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
