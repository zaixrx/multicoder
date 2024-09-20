import { createContext, useContext, useState } from "react";
import { Member, RoomContext } from "../App";
import CodeArea, { CursorPosition } from "./CodeArea";
import MouseCursor from "./MouseCursor";
import Interpolater from "../common/Interpolater";

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
    <>
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
    </>
  );
}

export default CodeEditor;
