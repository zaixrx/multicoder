import { Socket } from "socket.io";
import { Room } from "./roomConnection";

export type EventHandler = {
  [key: string]: (...params: any) => void;
};

export type Appdata = {
  sockets: Socket[];
  rooms: Room[];
};
