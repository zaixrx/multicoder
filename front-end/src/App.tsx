import { useState, useEffect, createContext } from "react";
import CodeEditor from "./components/CodeEditor";
import "./design.css";
import ConnectionHub from "./components/ConnectionHub";
import {
  makeConnection,
  sendRoomJoinRequest,
} from "./utils/socketEventHandler";
import { Socket } from "socket.io-client";
import Queue from "./utils/queue";
import { Vector2 } from "./common/Interpolater";

let socket: Socket;
export const RoomContext = createContext<any>(undefined);

export default function App() {
  const [room, setRoom] = useState<Room>({ id: "", members: [] });
  const [socketId, setSocketId] = useState<string>("");

  useEffect(() => {
    socket = makeConnection();

    socket.on("welcomeSent", (socketId) => {
      setSocketId(socketId);
    });

    socket.on("roomJoinRequest", (clientWhoRequestedToJoinId: string) => {
      socket.emit("roomJoinResponse", clientWhoRequestedToJoinId, true);
    });

    socket.on("roomCreated", (_room: Room) => {
      _room.members.forEach((member) => {
        member.mousePositionBuffer = new Queue<Vector2>();
      });
      setRoom(_room);
    });
  }, []);

  return (
    <main tabIndex={0}>
      <span>Socket Id: {socketId}</span>
      {room.id ? (
        <RoomContext.Provider value={[room, setRoom, socket, socketId]}>
          <CodeEditor />
        </RoomContext.Provider>
      ) : (
        <ConnectionHub
          onClientConnect={(socketToConnectToId: string) =>
            sendRoomJoinRequest(socketToConnectToId)
          }
        />
      )}
    </main>
  );
}

export type Member = {
  id: string;
  mousePositionBuffer: Queue<Vector2>;
};

export type Room = {
  id: string;
  members: Member[];
};
