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

export const RoomContext = createContext<any>(undefined);

export default function App() {
  const [socket, setSocket] = useState<Socket | undefined>();
  const [room, setRoom] = useState<Room>({ id: "", members: [] });

  useEffect(() => {
    let socket = makeConnection();
    socket.on("connect", () => {
      socket.on("roomJoinRequest", (clientWhoRequestedToJoinId: string) => {
        socket.emit("roomJoinResponse", clientWhoRequestedToJoinId, true);
      });

      socket.on("roomCreated", (_room: Room) => {
        _room.members.forEach((member) => {
          member.mousePositionBuffer = new Queue<Vector2>();
        });
        setRoom(_room);
      });
      setSocket(socket);
    });
  }, []);

  return (
    socket && (
      <main tabIndex={0}>
        <span>Socket Id: {socket.id}</span>
        {room.id ? (
          <RoomContext.Provider value={[room, setRoom, socket]}>
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
    )
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
