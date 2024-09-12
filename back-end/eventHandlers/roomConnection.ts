import { Socket } from "socket.io";
import { Appdata, EventHandler } from "./socketTypes";
import { getSocket } from "./utils";
import { ObjectId } from "bson";
import { MousePosition } from "./roomCommunication";

export type Member = {
  id: string;
  mousePosition: MousePosition;
};

export type Room = {
  id: ObjectId;
  members: Member[];
};

enum messages {
  ROOM_JOIN_REQUEST = "roomJoinRequest",
  ROOM_JOIN_RESPONSE = "roomJoinResponse",
}

const connect = (app: Appdata, currentSocket: Socket): EventHandler => ({
  [messages.ROOM_JOIN_REQUEST]: roomJoinRequestHandler(app, currentSocket),
  [messages.ROOM_JOIN_RESPONSE]: roomJoinResponseHandler(app, currentSocket),
});

const roomJoinRequestHandler =
  (app: Appdata, currentSocket: Socket) => (socketToConnectToId: string) => {
    const socketToConnectTo = getSocket(app, socketToConnectToId);
    if (socketToConnectTo) {
      socketToConnectTo.emit(messages.ROOM_JOIN_REQUEST, currentSocket.id);
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
  };
  members.forEach((member) => {
    member.emit("roomCreated", room);
  });
  app.rooms.push(room);
  return room;
}

export default connect;
