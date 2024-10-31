import { useContext, useEffect, useState } from "react";
import { Member, RoomContext, RoomContextType } from "../App";
import CodeArea, { CursorPosition } from "./CodeArea";
import MouseCursor from "./MouseCursor";
import Interpolater from "../common/Interpolater";
import ContextMenuWrapper from "./ContextMenuWrapper";
import DirectoriesTab from "./FileBrowser/DirectoriesTab";
import FilesInspector from "./FilesInspector";
import { FileNode } from "./FileBrowser/DirectoryTree";

export type EditorData = {
  lines: string[];
  cursorPosition: CursorPosition;
};

function CodeEditor() {
  const [room, setRoom, socket] = useContext<RoomContextType>(RoomContext);

  const [loadedFiles, setLoadedFiles] = useState<FileNode[]>([] as FileNode[]);

  useEffect(() => {
    if (!room.selectedFile || loadedFiles.includes(room.selectedFile)) return;
    setLoadedFiles([...loadedFiles, room.selectedFile]);
  }, [room.selectedFile]);

  function unloadFile(fileIndex: number) {
    if (loadedFiles.length <= fileIndex) return;
    const newLoadedFiles = [...loadedFiles];
    if (newLoadedFiles[fileIndex] === room.selectedFile) {
      const newRoom = { ...room };
      newRoom.selectedFile = undefined;
      setRoom(newRoom);
    }
    newLoadedFiles.splice(fileIndex, 1);
    setLoadedFiles(newLoadedFiles);
  }

  return (
    <div className="d-flex">
      <ContextMenuWrapper>
        <DirectoriesTab className="fill-screen-vertically dir-tab" />
      </ContextMenuWrapper>

      <div>
        <FilesInspector files={loadedFiles} onFileClose={unloadFile} />
        <CodeArea
          onCompile={() => {
            /*
              TODO: rewrite the compilation

              onCompile(
                editorData.lines.reduce(
                  (accumulator, currentValue) =>
                    `${accumulator}\n${currentValue}`
                )
              )
              */
          }}
        />
      </div>
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
      )}
    </div>
  );
}

export default CodeEditor;
