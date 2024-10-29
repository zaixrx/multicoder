import { createContext, useContext, useState } from "react";
import { Member, RoomContext } from "../App";
import CodeArea, { CursorPosition } from "./CodeArea";
import MouseCursor from "./MouseCursor";
import Interpolater from "../common/Interpolater";
import ContextMenuWrapper from "./ContextMenuWrapper";
import DirectoriesTab from "./FileBrowser/DirectoriesTab";

export const CodeEditorContext = createContext<any>(undefined);

export type EditorData = {
  lines: string[];
  cursorPosition: CursorPosition;
};

function CodeEditor({ onCompile }: any) {
  const [room, _setRoom, socket] = useContext(RoomContext);
  const [editorData, setEditorData] = useState<EditorData>({
    lines: [""],
    cursorPosition: { column: 0, line: 0 },
  });

  return (
    <div className="d-flex">
      <ContextMenuWrapper>
        <DirectoriesTab className="fill-screen-vertically dir-tab" />
      </ContextMenuWrapper>
      <CodeEditorContext.Provider
        value={{
          editorData,
          setEditorData,
        }}
      >
        <CodeArea
          onCompile={() =>
            onCompile(
              editorData.lines.reduce(
                (accumulator, currentValue) => `${accumulator}\n${currentValue}`
              )
            )
          }
        />
      </CodeEditorContext.Provider>
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
