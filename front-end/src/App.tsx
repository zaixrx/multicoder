import { io, Socket } from "socket.io-client";
import { useState, useEffect, useRef, createContext } from "react";

import Queue from "./assets/queue";
import { Member, Room } from "./assets/types/roomTypes";
import { Client } from "./assets/types/socketTypes";
import {
  CursorPosition,
  CursorSelection,
  Messages,
  Vector2,
} from "./assets/types/messageTypes";
import DirectoryTree, { FileNode, FolderNode } from "./assets/directoryTree";

import ConnectionHub from "./components/ConnectionHub";
import FileManager from "./components/managers/FileManager";
import ContextMenuWrapper from "./components/ContextMenuWrapper";

import "./styles.css";
import CodeEditor from "./components/controlled/CodeEditor";
import { bundle } from "./assets/bundler";

type UFT = {
  interpretCode: () => void;
  setFileContent: (
    path: string[],
    content: string[],
    sendUpdate?: boolean
  ) => void;
  setMemberCursor: (
    memberId: string,
    position: CursorPosition,
    selection: CursorSelection,
    sendUpdate?: boolean
  ) => void;
};
export const UtilityFunctions = createContext<UFT>({} as UFT);

export default function App() {
  const [client, setClient] = useState<Client | undefined>();
  const [room, setRoom] = useState<Room>({
    id: "",
    members: [],
    currentMember: {} as Member,
    directoryTree: new DirectoryTree(),
  });

  const socketRef = useRef<Socket>();
  const resultFrameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    socketRef.current = io("ws://127.0.0.1:3000");
    socketRef.current.on("connect", () => {
      setClient((client) => {
        client = new Client(socketRef.current || ({} as Socket), 0);
        const socket = client.socket;

        socket.on(
          Messages.ROOM_JOIN_REQUEST,
          (clientWhoRequestedToJoinId: string) => {
            client.send(
              Messages.ROOM_JOIN_RESPONSE,
              clientWhoRequestedToJoinId,
              true
            );
          }
        );

        socket.on(Messages.ROOM_CREATED, (room: Room) => {
          room.members.forEach((member) => {
            member.mousePositionQueue = new Queue<Vector2>();
            if (member.id === client.id) room.currentMember = member;
          });
          room.directoryTree = new DirectoryTree();
          setRoom(room);
        });

        socket.on(Messages.FILE_CREATED, (createdFileName: string) => {
          setRoom((room) => {
            appendFile(createdFileName, false, room);

            return room;
          });
        });

        socket.on(Messages.FILE_SELECTED, (path: string[]) => {
          selectFile(path, false);
        });

        socket.on(Messages.FOLDER_CREATED, (folderName: string) => {
          setRoom((room) => {
            appendFolder(folderName, false, room);

            return room;
          });
        });

        socket.on(Messages.FOLDER_SELECTED, (path: string[]) => {
          selectFolder(path, false);
        });

        socket.on(
          Messages.FILE_CONTENT_CHANGED,
          (path: string[], content: string[]) => {
            setFileContent(path, content, false);
          }
        );

        socket.on(
          Messages.MEMBER_CURSOR_CHANGED,
          (
            memberId: string,
            position: CursorPosition,
            selection: CursorSelection
          ) => {
            setMemberCursor(memberId, position, selection, false);
          }
        );

        socket.on(Messages.EXECUTE_CODE, () => {
          interpretCode(false);
        });

        return client;
      });
    });
  }, []);

  function postRoomChanges(message: Messages, ...data: any[]) {
    client?.send(message, room.id, ...data);
  }

  function setFileContent(
    path: string[],
    content: string[],
    sendUpdate = true
  ) {
    setRoom((prevRoom) => {
      const room = { ...prevRoom };

      let file = room.directoryTree.findNode(path);
      if (!(file && file instanceof FileNode)) return prevRoom;

      file.content = [...content];

      if (sendUpdate)
        postRoomChanges(Messages.FILE_CONTENT_CHANGED, path, content);

      return room;
    });
  }

  function setMemberCursor(
    memberId: string,
    position: CursorPosition,
    selection: CursorSelection,
    sendUpdate = true
  ) {
    setRoom((prevRoom) => {
      const room = { ...prevRoom };

      const member = room.members.find((m) => m.id === memberId);
      if (!member) return prevRoom;

      member.cursorPosition = position;
      member.cursorSelection = selection;

      if (sendUpdate)
        postRoomChanges(
          Messages.MEMBER_CURSOR_CHANGED,
          memberId,
          position,
          selection
        );

      return room;
    });
  }

  function selectFile(path: string[] | undefined, sendUpdate = true) {
    setRoom((prevRoom) => {
      const room = { ...prevRoom };

      if (path) {
        const file = prevRoom.directoryTree.findNode(path);
        if (!(file && file instanceof FileNode)) return prevRoom;
        room.directoryTree.selectedFile = file;

        room.members.forEach((m) => {
          m.cursorPosition = { line: 0, column: 0 };
          m.cursorSelection = {
            start: { line: 0, column: 0 },
            end: { line: 0, column: 0 },
          };
        });
      } else {
        room.directoryTree.selectedFile = undefined;
      }

      if (sendUpdate) postRoomChanges(Messages.FILE_SELECTED, path);

      return room;
    });
  }

  function selectFolder(path: string[] | undefined, sendUpdate = true) {
    setRoom((prevRoom) => {
      const room = { ...prevRoom };
      if (path) {
        const folder = room.directoryTree.findNode(path);
        if (!(folder && folder instanceof FolderNode)) return prevRoom;
        room.directoryTree.selectedFolder = folder;
      } else {
        room.directoryTree.selectedFolder = undefined;
      }

      if (sendUpdate) postRoomChanges(Messages.FOLDER_SELECTED, path);

      return room;
    });
  }

  function appendFile(
    fileName: string,
    sendUpdate = true,
    prevRoom = room
  ): FileNode | undefined {
    const room = { ...prevRoom };
    const file = room.directoryTree.appendFileToSelectedDir(fileName);
    setRoom(room);

    if (sendUpdate) postRoomChanges(Messages.FILE_CREATED, fileName);

    return file;
  }

  function appendFolder(
    folderName: string,
    sendUpdate = true,
    prevRoom = room
  ): FolderNode | undefined {
    const room = { ...prevRoom };
    const folder = room.directoryTree.appendFolderToSelectedDir(folderName);
    setRoom(room);

    if (sendUpdate) postRoomChanges(Messages.FOLDER_CREATED, folderName);

    return folder;
  }

  function interpretCode(sendUpdate = true) {
    if (!resultFrameRef.current) return;

    const { current: resultFrame } = resultFrameRef;

    setRoom((prevRoom) => {
      let bundledCode = "";
      let errorMessage = "";

      try {
        bundledCode = bundle(prevRoom.directoryTree);
      } catch (error: any) {
        errorMessage = "BUNDLELING_ERROR: " + error.message;
      }

      resultFrame.srcdoc = `
        <html>
          <head></head>
          <body>
            <pre class="error" id="error">${errorMessage}</pre>
            <script>
              try {
                ${bundledCode}
              } catch (e) {
                document.getElementById("error").innerHTML = "RUNTIME_ERROR: " + e.message;
              }
            </script>
          </body>
        </html>
      `;

      if (sendUpdate) postRoomChanges(Messages.EXECUTE_CODE);

      return prevRoom;
    });
  }

  return client ? (
    <UtilityFunctions.Provider
      value={{ setFileContent, setMemberCursor, interpretCode }}
    >
      <main>
        Client Id: <span className="user-select-all">{client.id}</span>
        {room.id ? (
          <div className="d-flex fill-screen-vertically">
            <ContextMenuWrapper>
              <FileManager
                directoryTree={room.directoryTree}
                appendFile={appendFile}
                selectFile={selectFile}
                appendFolder={appendFolder}
                selectFolder={selectFolder}
              />
            </ContextMenuWrapper>
            {room.directoryTree.selectedFile && (
              <section className="flex-column">
                <CodeEditor
                  selectedFile={room.directoryTree.selectedFile}
                  members={room.members}
                  currentMember={room.currentMember}
                />
                <iframe className="output-frame" ref={resultFrameRef} />
              </section>
            )}
          </div>
        ) : (
          <ConnectionHub
            onClientConnect={(clientToConnectToId: string) =>
              client.send(Messages.ROOM_JOIN_REQUEST, clientToConnectToId)
            }
          />
        )}
      </main>
    </UtilityFunctions.Provider>
  ) : (
    "It looks like we are having trouble to establish a connection with you"
  );
}
