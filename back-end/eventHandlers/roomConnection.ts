import { Socket } from "socket.io";
import { Appdata, EventHandler } from "./socketTypes";
import { getSocket } from "./utils";
import { ObjectId } from "bson";
import { MousePosition } from "./roomCommunication";
import DirectoryTree from "./utils/directoryTree";

export type Member = {
  id: string;
  mousePosition: MousePosition;
};

export type Room = {
  id: ObjectId;
  members: Member[];
  directoryTree: DirectoryTree;
};

enum Message {
  ROOM_JOIN_REQUEST = "roomJoinRequest",
  ROOM_JOIN_RESPONSE = "roomJoinResponse",
}

const connect = (app: Appdata, currentSocket: Socket): EventHandler => ({
  [Message.ROOM_JOIN_REQUEST]: roomJoinRequestHandler(app, currentSocket),
  [Message.ROOM_JOIN_RESPONSE]: roomJoinResponseHandler(app, currentSocket),
});

const roomJoinRequestHandler =
  (app: Appdata, currentSocket: Socket) => (socketToConnectToId: string) => {
    const socketToConnectTo = getSocket(app, socketToConnectToId);
    if (socketToConnectTo) {
      socketToConnectTo.emit(Message.ROOM_JOIN_REQUEST, currentSocket.id);
    }
  };

const roomJoinResponseHandler =
  (app: Appdata, currentSocket: Socket) =>
  (clientWhoRequestedToJoinId: string, accpetedReqeust: boolean) => {
    const clientWhoRequestedToJoin = getSocket(app, clientWhoRequestedToJoinId);
    if (clientWhoRequestedToJoin) {
      if (accpetedReqeust) {
        const members = [currentSocket, clientWhoRequestedToJoin];
        createRoom(app, members);
      } else {
        clientWhoRequestedToJoin.emit("roomJoinDenied", currentSocket.id);
      }
    }
  };

function createRoom(app: Appdata, members: Socket[]) {
  const room: Room = {
    id: new ObjectId(),
    members: members.map((m) => ({
      id: m.id,
      mousePosition: { x: 0, y: 0 },
    })),
    directoryTree: {} as DirectoryTree,
  };
  members.forEach((member) => {
    member.emit("roomCreated", room);
  });
  app.rooms.push(room);
  return room;
}

export default connect;
