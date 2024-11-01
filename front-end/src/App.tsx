import { useState, useEffect } from "react";
import { Socket } from "socket.io-client";
import {
  makeConnection,
  sendRoomJoinRequest,
} from "./utils/socketEventHandler";
import Queue from "./utils/queue";
import { Vector2 } from "./common/Interpolater";
import DirectoryTree, { FileNode, FolderNode } from "./utils/directoryTree";
import ConnectionHub from "./components/ConnectionHub";
import CodeEditorManager from "./components/Managers/CodeEditorManager";

import "./design.css";
import FileManager from "./components/Managers/FileManager";
import ContextMenuWrapper from "./components/ContextMenuWrapper";

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
  });

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

  function setSelectedFile(
    newFile: FileNode | ((previousSelectedFile: FileNode) => FileNode)
  ) {
    const _room = { ...room };
    if (typeof newFile === "function") {
      _room.directoryTree.selectedFile = newFile(
        room.directoryTree.selectedFile
      );
    } else {
      _room.directoryTree.selectedFile = newFile;
    }
    setRoom(_room);
  }

  function setCurrentDirectory(currentDirectory: FolderNode) {
    const _room = { ...room };
    _room.directoryTree.currentDirectory = currentDirectory;
    setRoom(_room);
  }

  function appendFile(fileName: string) {
    const newRoom = { ...room };
    const file = newRoom.directoryTree.appendFile(fileName);
    setRoom(newRoom);
    return file;
  }

  function appendFolder(folderName: string) {
    const newRoom = { ...room };
    const folder = newRoom.directoryTree.appendFolder(folderName);
    setRoom(newRoom);
    return folder;
  }

  return socket ? (
    <main>
      {room.id ? (
        <div className="d-flex fill-screen-vertically">
          <ContextMenuWrapper>
            <FileManager
              directoryTree={room.directoryTree}
              appendFile={appendFile}
              appendFolder={appendFolder}
              setCurrentDirectory={setCurrentDirectory}
              setSelectedFile={setSelectedFile}
            />
          </ContextMenuWrapper>
          {room.directoryTree.selectedFile.indexes && (
            <CodeEditorManager
              selectedFile={room.directoryTree.selectedFile}
              setSelectedFile={setSelectedFile}
            />
          )}
        </div>
      ) : (
        <>
          <span>Socket Id: {socket.id}</span>
          <ConnectionHub
            onClientConnect={(socketToConnectToId: string) =>
              sendRoomJoinRequest(socketToConnectToId)
            }
            socketID={socket.id || ""}
          />
        </>
      )}
    </main>
  ) : (
    "It looks like we are having trouble to establish a connection with you"
  );
}

/*
{room.members.map(
        (member: Member, index: number) =>
          member.id !== socket.id && (
            <Interpolater
              key={index}
              positionBuffer={member.mousePositionBuffer}
            >
              <MouseCursor
                position={{
                  x: 0,
                  y: 0,
                }}
              />
            </Interpolater>
          )
      )} */

export type Member = {
  id: string;
  mousePositionBuffer: Queue<Vector2>;
};

export type Room = {
  id: string;
  members: Member[];
  directoryTree: DirectoryTree;
};
