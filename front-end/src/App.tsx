import { useState, useEffect, createContext, useRef } from "react";
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
import DirectoryTree, {
  FileNode,
} from "./components/FileBrowser/DirectoryTree";

export const RoomContext = createContext<any>(undefined);
export type RoomContextType = [
  room: Room,
  setRoom: React.Dispatch<React.SetStateAction<Room>>,
  socket: Socket
];

export default function App() {
  const [socket, setSocket] = useState<Socket | undefined>();
  const [room, setRoom] = useState<Room>({
    id: "",
    members: [],
    directoryTree: new DirectoryTree(),
    selectedFile: undefined,
  });

  //const consoleOutput = useRef<HTMLDivElement>(null);
  const outputFrameRef = useRef<HTMLIFrameElement>(null);

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
        _room.directoryTree = new DirectoryTree();
        setRoom(_room);
      });
      setSocket(socket);
    });
  }, []);

  function compileCode(code: string) {
    if (!outputFrameRef.current) return;
    outputFrameRef.current.srcdoc = `
            <html>
            <body>
                <script>
                    try {
                        ${code}
                    } catch (error) {
                        document.body.innerHTML = '<pre>' + error.toString() + '</pre>';
                    }
                <\/script>
            </body>
            </html>
            `;
  }

  return (
    socket && (
      <main className="fill-screen-vertically">
        <span>Socket Id: {socket.id}</span>
        <RoomContext.Provider value={[room, setRoom, socket]}>
          {room.id ? (
            <CodeEditor onCompile={compileCode} />
          ) : (
            <ConnectionHub
              onClientConnect={(socketToConnectToId: string) =>
                sendRoomJoinRequest(socketToConnectToId)
              }
            />
          )}
        </RoomContext.Provider>
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
  directoryTree: DirectoryTree;
  selectedFile: FileNode | undefined;
  members: Member[];
};
