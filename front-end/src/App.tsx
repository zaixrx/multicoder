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
import { getTokens } from "./assets/utils";
import { Badge } from "./components/ui/badge";
import { toast, Toaster } from "sonner";

export interface UFT {
  interpretCode: () => void;
  setFileContent: (
    memberId: string,
    path: string[],
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
    currentMember: {} as Member,
    members: new Map<string, Member>(),
    directoryTree: new DirectoryTree(),
  });

  const socketRef = useRef<Socket>();
  const resultFrameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_BACKEND_WSURL);
    socketRef.current.on("connect", () => {
      setClient((client) => {
        const socket = socketRef.current || ({} as Socket);
        client = new Client(socket);

        socket.on(Messages.NEW_MEMBER, (member: Member) => {
          setRoom((prevRoom) => {
            const room = { ...prevRoom };

            room.members.set(member.id, member);

            return room;
          });
        });

        socket.on(
          Messages.ROOM_JOIN,
          (
            roomId: string,
            roomMembers: Member[],
            directoryTree: DirectoryTree
          ) => {
            console.log(directoryTree);

            const room: Room = {
              id: roomId,
              currentMember: {} as Member,
              members: new Map<string, Member>(
                roomMembers.map((member) => [member.id, member])
              ),
              directoryTree: new DirectoryTree(),
            };

            const currentMember = room.members.get(client.id);
            if (!currentMember) return;
            room.currentMember = currentMember;

            setRoom(room);
          }
        );

        socket.on(Messages.FILE_CREATED, (path: string[]) => {
          setRoom((room) => {
            appendFile(path, false, room);

            return room;
          });
        });

        socket.on(Messages.FILE_SELECTED, (path: string[]) => {
          selectFile(path, false);
        });

        socket.on(Messages.FOLDER_CREATED, (path: string[]) => {
          setRoom((room) => {
            appendFolder(path, false, room);

            return room;
          });
        });

        socket.on(Messages.FOLDER_SELECTED, (path: string[]) => {
          selectFolder(path, false);
        });

        socket.on(
          Messages.FILE_CONTENT_CHANGED,
          (
            memberId: string,
            path: string[],
            fileContent: string[],
            position: CursorPosition,
            selection: CursorSelection
          ) => {
            setFileContent(
              memberId,
              path,
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

        socket.on(Messages.NODE_NAME_CHANGED, (path: string[]) => {
          changeFileName(path, false);
        });

        socket.on(Messages.ERROR, (message) => {
          toast("Error", {
            description: message,
          });
        });
        return client;
      });
    });
  }, []);

  function postRoomChanges(message: Messages, ...data: any[]) {
    client?.send(message, room.id, ...data);
  }

  async function setFileContent(
    memberId: string,
    path: string[],
    fileContent: string[],
    position: CursorPosition,
    selection: CursorSelection,
    sendUpdate?: boolean
  ) {
    setRoom((prevRoom) => {
      const room = { ...prevRoom };

      const member = room.members.get(memberId);
      if (!member) {
        toast(`Cannot find member with id ${memberId}`);
        return prevRoom;
      }

      let file: FileNode | null = room.directoryTree.getFile(path);
      if (!file) {
        toast(`Cannot find file with path ${path}`);
        return prevRoom;
      }

      member.cursorPosition = position;
      member.cursorSelection = selection;

      file.lines = fileContent.map((content) => ({ content, tokens: [] }));

      if (sendUpdate) {
        postRoomChanges(
          Messages.FILE_CONTENT_CHANGED,
          path,
          fileContent,
          position,
          selection
        );
      }

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

      let file = room.directoryTree.getFile(path);
      if (!file) return prevRoom;

      file.lines = lines;

      return room;
    });
  }

  function selectFile(path: string[] | null, sendUpdate = true) {
    setRoom((prevRoom) => {
      const room = { ...prevRoom };

      if (path) {
        const file = prevRoom.directoryTree.getFile(path);
        if (!file) {
          toast(`Cannot find file with path ${path}`);
          return prevRoom;
        }

        room.directoryTree.selectedFile = file;

        room.members.forEach((m) => {
          m.cursorPosition = { line: 0, column: 0 };
          m.cursorSelection = {
            start: { line: 0, column: 0 },
            end: { line: 0, column: 0 },
          };
        });
      } else {
        room.directoryTree.selectedFile = null;
      }

      if (sendUpdate) postRoomChanges(Messages.FILE_SELECTED, path);

      return room;
    });
  }

  function selectFolder(path: string[] | null, sendUpdate = true) {
    setRoom((prevRoom) => {
      const room = { ...prevRoom };
      if (path) {
        const folder = room.directoryTree.getFolder(path);
        if (!folder) {
          toast(`Error: Cannot find folder with path "${path}"`);
          return prevRoom;
        }
        room.directoryTree.selectedFolder = folder;
      } else {
        room.directoryTree.selectedFolder = null;
      }

      if (sendUpdate) postRoomChanges(Messages.FOLDER_SELECTED, path);

      return room;
    });
  }

  function appendFile(
    path: string[],
    sendUpdate = true,
    prevRoom = room
  ): FileNode | null {
    const room = { ...prevRoom };

    const file: FileNode | null = room.directoryTree.appendFile(path);

    if (!file) {
      toast(`Error: ${path.join("/")} file DNE`);
      return null;
    }

    setRoom(room);

    if (sendUpdate) postRoomChanges(Messages.FILE_CREATED, path);

    return file;
  }

  function changeFileName(path: string[], sendUpdate: boolean = true) {
    setRoom((prevRoom) => {
      const room = { ...prevRoom };

      const node = room.directoryTree.getFile(path);
      if (!node) return room;

      node.name = path[path.length - 1];
      if (sendUpdate) postRoomChanges(Messages.NODE_NAME_CHANGED, path);

      return room;
    });
  }

  function appendFolder(
    path: string[],
    sendUpdate = true,
    prevRoom = room
  ): FolderNode | null {
    const room = { ...prevRoom };
    const folder: FolderNode | null = room.directoryTree.appendFolder(path);

    if (!folder) {
      toast(`Error: ${path.join("/")} folder DNE`);
      return null;
    }

    setRoom(room);

    if (sendUpdate) postRoomChanges(Messages.FOLDER_CREATED, path);

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

  const { id, directoryTree, currentMember, members } = room;

  return client ? (
    <UtilityFunctions.Provider value={{ setFileContent, interpretCode }}>
      <Toaster />
      <main className="h-screen bg-[#070708] text-white p-2">
        {id ? (
          <>
            <Badge>{id}</Badge>
            <div className="flex gap-2 max-h-100">
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
                    members={[...members.values()]}
                    lines={directoryTree.selectedFile.lines}
                    path={directoryTree.selectedFile.path}
                    currentMember={{ ...currentMember }}
                  />
                  <iframe className="output-frame" ref={resultFrameRef} />
                </section>
              )}
            </div>
          </>
        ) : (
          <div className="h-100 flex items-center justify-center">
            <ConnectionHub
              onRoomCreate={() => {
                client.send(Messages.ROOM_CREATE);
              }}
              onRoomJoin={(roomId: string) =>
                client.send(Messages.ROOM_JOIN, roomId)
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
