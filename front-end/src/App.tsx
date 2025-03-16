import { io, Socket } from "socket.io-client";
import { useState, useEffect, useRef, createContext } from "react";

import { Member, Room } from "./assets/types/roomTypes";
import { Client } from "./assets/types/socketTypes";
import {
  CursorPosition,
  CursorSelection,
  Messages,
} from "./assets/types/messageTypes";
import DirectoryTree, {
  FileNode,
  FolderNode,
  Line,
} from "./assets/directoryTree";

import ConnectionHub from "./components/ConnectionHub";
import FileManager from "./components/managers/FileManager";

import "./styles.css";
import CodeEditor from "./components/controlled/CodeEditor";
import { bundle } from "./assets/bundler";
import { arrayCopy, getTokens } from "./assets/utils";

export interface UFT {
  interpretCode: () => void;
  setFileContent: (
    path: string[],
    memberId: string,
    lines: string[],
    position: CursorPosition,
    selection: CursorSelection,
    sendUpdate?: boolean
  ) => void;
}
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

  const { id, directoryTree, currentMember, members } = room;

  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_BACKEND_WSURL);
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
          room.currentMember =
            room.members.find((m) => m.id === client.id) || ({} as Member);

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
          (
            path: string[],
            memberId: string,
            fileContent: string[],
            position: CursorPosition,
            selection: CursorSelection
          ) => {
            setFileContent(
              path,
              memberId,
              fileContent,
              position,
              selection,
              false
            );
          }
        );

        socket.on(Messages.EXECUTE_CODE, () => {
          interpretCode(false);
        });

        socket.on(
          Messages.NODE_NAME_CHANGED,
          (nodePath: string[], newName: string) => {
            changeFileName(nodePath, newName, false);
          }
        );

        return client;
      });
    });
  }, []);

  function postRoomChanges(message: Messages, ...data: any[]) {
    client?.send(message, room.id, ...data);
  }

  async function setFileContent(
    path: string[],
    memberId: string,
    fileContent: string[],
    position: CursorPosition,
    selection: CursorSelection,
    sendUpdate?: boolean
  ) {
    setRoom((prevRoom) => {
      const room = { ...prevRoom };

      const member = room.members.find((m) => m.id === memberId);
      if (!member) return prevRoom;

      let file = room.directoryTree.findNode(path);
      if (!(file && file instanceof FileNode)) return prevRoom;

      member.cursorPosition = position;
      member.cursorSelection = selection;

      file.lines = fileContent.map((content) => ({ content, tokens: [] }));

      if (sendUpdate)
        postRoomChanges(
          Messages.FILE_CONTENT_CHANGED,
          path,
          memberId,
          fileContent,
          position,
          selection
        );

      return room;
    });

    const lines: Line[] = [];
    for (let i = 0; i < fileContent.length; i++) {
      lines.push({
        content: fileContent[i],
        tokens: await getTokens(fileContent[i]),
      });
    }

    setRoom((prevRoom) => {
      const room = { ...prevRoom };

      const member = room.members.find((m) => m.id === memberId);
      if (!member) return prevRoom;

      let file = room.directoryTree.findNode(path);
      if (!(file && file instanceof FileNode)) return prevRoom;

      file.lines = lines;

      return room;
    });
  }

  function setMemberCursorOnFile(
    path: string[],
    memberId: string,
    position: CursorPosition,
    selection: CursorSelection,
    sendUpdate?: boolean
  ) {
    setRoom((prevRoom) => {
      const room = { ...prevRoom };

      const member = room.members.find((m) => m.id === memberId);
      if (!member) return prevRoom;

      let file = room.directoryTree.findNode(path);
      if (!(file && file instanceof FileNode)) return prevRoom;

      member.cursorPosition = position;
      member.cursorSelection = selection;

      if (sendUpdate)
        postRoomChanges(
          Messages.FILE_MEMBER_CURSOR,
          path,
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

  function changeFileName(
    nodePath: string[],
    newName: string,
    sendUpdate: boolean = true
  ) {
    if (!newName) return;

    setRoom((prevRoom) => {
      const room = { ...prevRoom };

      const node = room.directoryTree.findNode(nodePath);
      if (!node) return room;

      node.name = newName;
      if (sendUpdate) postRoomChanges(Messages.NODE_NAME_CHANGED);

      return room;
    });
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
        console.error(error);
        errorMessage = "BUNDLELING_ERROR: " + error.message;
      }

      resultFrame.srcdoc = `
        <html>
          <head>
            <style>
              .error {
                overflow:hidden;
                border-width: 2px;
                border-color: red;
                color: #fff;
                padding: 1rem;
                background-color: rgba(255, 0, 0, 0.6);
              }
            </style>
          </head>
          <body>
            <div class="error" id="error">${errorMessage}</div>
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
    <UtilityFunctions.Provider value={{ setFileContent, interpretCode }}>
      <main className="h-screen bg-[#070708] text-white p-2">
        {id ? (
          <div className="h-100 flex gap-2">
            <FileManager
              directoryTree={directoryTree}
              appendFile={appendFile}
              selectFile={selectFile}
              appendFolder={appendFolder}
              selectFolder={selectFolder}
              changeFileName={changeFileName}
            />
            {directoryTree.selectedFile && (
              <section className="flex-column">
                <CodeEditor
                  members={[...members]}
                  lines={arrayCopy<Line>(directoryTree.selectedFile.lines)}
                  path={directoryTree.selectedFile.path}
                  currentMember={{ ...currentMember }}
                />
                <iframe className="output-frame" ref={resultFrameRef} />
              </section>
            )}
          </div>
        ) : (
          <div className="h-100 flex items-center justify-center">
            <ConnectionHub
              clientId={client.id}
              onClientConnect={(clientToConnectToId: string) =>
                client.send(Messages.ROOM_JOIN_REQUEST, clientToConnectToId)
              }
            />
          </div>
        )}
      </main>
    </UtilityFunctions.Provider>
  ) : (
    "It looks like we are having trouble to establish a connection with you"
  );
}
