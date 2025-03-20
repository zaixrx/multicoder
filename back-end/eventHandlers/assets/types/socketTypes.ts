import { Socket } from "socket.io";
import { Room } from "./roomTypes";
import { Messages } from "./messageTypes";
import { ObjectId } from "bson";

export class Client {
  public id: string;
  public socket: Socket;
  private _joinedRoom: string;

  constructor(socket: Socket) {
    this.socket = socket;
    this.id = socket.id;
    this._joinedRoom = "";
  }

  public get joinedRoom() {
    return this._joinedRoom;
  }

  public set joinedRoom(roomId: string) {
    if (ObjectId.isValid(roomId)) {
      this._joinedRoom = roomId;
    }
  }

  send(message: Messages, ...data: any[]) {
    this.socket.emit(message, ...data);
  }

  sendAll(message: Messages, ...data: any[]) {
    if (this._joinedRoom)
      this.socket.to(this._joinedRoom).emit(message, ...data);
  }

  broadcast(message: Messages, ...data: any[]) {
    if (this._joinedRoom) {
      this.socket.broadcast.to(this._joinedRoom).emit(message, ...data);
    }
  }
}

export type EventHandler = {
  [key: string]: {
    eventHandler: (req: Request) => void;
    middlewares: ((
      handle: Handle,
      client: Client,
      req: Request,
      ...options: any
    ) => void)[];
    options?: any[];
  };
};

export type Appdata = {
  clients: Map<string, Client>;
  rooms: Map<string, Room>;
};

export interface Handle {
  app: Appdata;
}

export interface Request {
  params: any[];
  status: number;
  state: {
    [key: string]: any;
  };
}
