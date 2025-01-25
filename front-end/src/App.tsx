import { useState, useEffect, useRef } from "react";
import {
  makeConnection,
} from "./assets/socketEventHandler";
import { Messages, Vector2 } from "./assets/types/messageTypes";
import DirectoryTree, { FileNode, FolderNode } from "./assets/directoryTree";
import { Client } from "./assets/types/socketTypes";
import { Room } from "./assets/types/roomTypes";
import Queue from "./assets/queue";

import ConnectionHub from "./components/ConnectionHub";
import CodeEditorManager from "./components/Managers/CodeEditorManager";
import FileManager from "./components/Managers/FileManager";
import ContextMenuWrapper from "./components/ContextMenuWrapper";
import "./design.css";

export type RoomContextType = [
  room: Room,
  setRoom: React.Dispatch<React.SetStateAction<Room>>,
  client: Client
];

export default function App() {
  const [client, setClient] = useState<Client | undefined>();
  const [room, setRoom] = useState<Room>({
    id: "",
    members: [],
    directoryTree: new DirectoryTree(),
  });
  const resultFrameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const socket = makeConnection();
    
    socket.on("connect", () => {
      socket.on(Messages.ROOM_JOIN_REQUEST, (clientWhoRequestedToJoinId: string) => {
        alert(`client ${clientWhoRequestedToJoinId} requested to join you`);
        socket.emit(Messages.ROOM_JOIN_RESPONSE, clientWhoRequestedToJoinId, true);
      });

      socket.on(Messages.ROOM_CREATED, (_room: Room) => {
        _room.members.forEach((member) => {
          member.mousePositionQueue = new Queue<Vector2>();
        });
        _room.directoryTree = new DirectoryTree();
        setRoom(_room);
      });

      setClient(new Client(socket, 0));
    });
  }, []);

  function postDirectoryTreeChanges(
    message: Messages,
    data: FileNode | FolderNode,
  ) {
    client?.send(message, room.id, data);
  }

  function setSelectedFile(
    newFile: FileNode | ((previousSelectedFile: FileNode) => FileNode)
  ) {
    const _room = { ...room };
    _room.directoryTree.selectedFile = typeof newFile === "function" ? newFile(
      room.directoryTree.selectedFile
    ) : newFile;

    setRoom(_room);
    postDirectoryTreeChanges(
      Messages.FILE_SELECTED,
      _room.directoryTree.selectedFile
    );
  }

  function setSelectedDirectory(selectedDirectory: FolderNode) {
    const _room = { ...room };
    _room.directoryTree.selectedDirectory = selectedDirectory;

    setRoom(_room);
    postDirectoryTreeChanges(
      Messages.DIRECTORY_SELECTED,
      selectedDirectory
    );
  }

  function appendFile(fileName: string) {
    const newRoom = { ...room };
    const file = newRoom.directoryTree.appendFile(fileName);
    setRoom(newRoom);
    
    postDirectoryTreeChanges(Messages.FILE_CREATED, file);
    return file;
  }

  function appendFolder(folderName: string) {
    const newRoom = { ...room };
    const folder = newRoom.directoryTree.appendFolder(folderName);
    setRoom(newRoom);

    postDirectoryTreeChanges(Messages.FOLDER_CREATED, folder);
    return folder;
  }

  function interpretJSCode(fileContent: string[]) {
    if (!resultFrameRef.current) return;

    const mergedFileContent = fileContent.join("");
    resultFrameRef.current.srcdoc = `
    <html>
    <body>
        <script>
            try {
                ${mergedFileContent}
            } catch (error) {
                document.body.innerHTML = '<pre>' + error.toString() + '</pre>';
            }
        <\/script>
    </body>
    </html>
`;
  }

  return client ? (
    <main>
      {room.id ? (
        <div className="d-flex fill-screen-vertically">
          <ContextMenuWrapper>
            <FileManager
              directoryTree={room.directoryTree}
              appendFile={appendFile}
              appendFolder={appendFolder}
              setCurrentDirectory={setSelectedDirectory}
              setSelectedFile={setSelectedFile}
            />
          </ContextMenuWrapper>
          {room.directoryTree.selectedFile.indexes && (
            <div className="flex-column">
              <CodeEditorManager
                interpretJSCode={interpretJSCode}
                selectedFile={room.directoryTree.selectedFile}
                setSelectedFile={setSelectedFile}
              />
              <iframe ref={resultFrameRef} />
            </div>
          )}
        </div>
      ) : (
        <>
          <span>Client Id: {client.id}</span>
          <ConnectionHub
            onClientConnect={(clientToConnectToId: string) =>
              client.send(Messages.ROOM_JOIN_REQUEST, clientToConnectToId)
            }
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