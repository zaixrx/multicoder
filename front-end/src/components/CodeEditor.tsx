import { createContext, useContext, useRef, useState } from "react";
import { Member, RoomContext } from "../App";
import Console from "./Console";
import CodeArea, { CursorPosition } from "./CodeArea";
import MouseCursor from "./MouseCursor";
import Interpolater from "../common/Interpolater";

export const CodeEditorContext = createContext<any>(undefined);

export type EditorData = {
  lines: Line[];
  cursorPosition: CursorPosition;
};

function CodeEditor() {
  let { current: consolePrintLine } = useRef<Function>(() => {});

  const [room, socketId] = useContext(RoomContext);
  const [editorData, setEditorData] = useState<EditorData>({
    lines: [{ code: "" }],
    cursorPosition: { column: 0, line: 1 },
  });

  function compileCode() {
    let code = editorData.lines
      .map((l) => l.code)
      .reduce((accumulator, currentValue) => `${accumulator}\n${currentValue}`);
    try {
      eval(code);
      consolePrintLine("Compiled With Success!");
    } catch (error) {
      if (error instanceof Error) {
        consolePrintLine(error.message);
      }
    }
  }

  return (
    <>
      <Console
        getConsolePrintLine={(_consolePrintLine: Function) =>
          (consolePrintLine = _consolePrintLine)
        }
      />
      <CodeEditorContext.Provider
        value={{
          editorData,
          setEditorData,
        }}
      >
        <CodeArea onCompile={compileCode} />
      </CodeEditorContext.Provider>
      {room.members.map((member: Member, index: number) => {
        console.log(member.id, socketId);
        if (member.id === socketId) return;
        return (
          <Interpolater key={index} positionBuffer={member.mousePositionBuffer}>
            <MouseCursor
              position={{
                x: 0,
                y: 0,
              }}
            />
          </Interpolater>
        );
      })}
    </>
  );
}

export default CodeEditor;

export type Line = {
  code: string;
};
