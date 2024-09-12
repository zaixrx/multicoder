import { createContext, useContext, useEffect, useState } from "react";
import {
  sendKeysPressedBuffer,
  sendMousePosition,
} from "../utils/socketEventHandler";
import { Member, Room, RoomContext } from "../App";
//import { CodeEditorContextProvider } from "./CodeEditorContext";
import Console from "./Console";
import CodeArea from "./CodeArea";
import MouseCursor from "./MouseCursor";

let consolePrintLine: Function;
let myMousePosition: MousePosition = { x: 0, y: 0 };
let myKeysPressedBuffer: string[] = [];
let keysPressedByClient: string[] = [];

export const CodeEditorContext = createContext<any>(undefined);

function CodeEditor() {
  const [room, setRoom, socket, socketId] = useContext(RoomContext);

  const [lines, setLines] = useState<Line[]>([{ code: "" }]);
  const [selectedLine, setSelectedLine] = useState<number>(1);
  const [cursorPosition, setCursorPosition] = useState<CursorPosition>({
    line: 1,
    column: 0,
  });

  useEffect(() => {
    setInterval(socketTick, 50);

    socket.on(
      "mousePosition",
      (socketId: string, mousePosition: MousePosition) => {
        setRoom((room: Room) => {
          const _room: Room = { ...room };

          if (_room) {
            if (_room.members) {
              const member = _room.members.find(
                (m: Member) => m.id === socketId
              );
              if (member) {
                member.mousePosition = mousePosition;
              }
            }
          }

          return _room;
        });
      }
    );

    socket.on("keysPressed", (_socketId: string, keysPressed: string[]) => {
      keysPressed.forEach((key: string) => {
        setSelectedLine((lineIndex) => {
          handleKeyDown(key, lineIndex);
          keysPressedByClient.push(key);
          return lineIndex;
        });
      });
    });
  }, []);

  function socketTick() {
    sendMousePosition(room.id, myMousePosition);

    if (myKeysPressedBuffer.length) {
      sendKeysPressedBuffer(room.id, myKeysPressedBuffer);
      myKeysPressedBuffer = [];
    }
  }

  function compileCode() {
    let code = lines
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
    <div
      onMouseMove={(e) => (myMousePosition = { x: e.clientX, y: e.clientY })}
    >
      <Console
        getConsolePrintLine={(_consolePrintLine: Function) =>
          (consolePrintLine = _consolePrintLine)
        }
      />
      <CodeEditorContext.Provider
        value={{
          lines,
          setLines,
          selectedLine,
          setSelectedLine,
          cursorPosition,
          setCursorPosition,
        }}
      >
        <CodeArea
          onCompile={compileCode}
          onKeyDown={(key: string) => {
            myKeysPressedBuffer.push(key);
            handleKeyDown(key, selectedLine);
          }}
          moveCursor={moveCursor}
        />
      </CodeEditorContext.Provider>
      {room.members.map((member: Member, index: number) => {
        if (member.id === socketId) return;
        return (
          <MouseCursor
            key={index}
            x={member.mousePosition.x}
            y={member.mousePosition.y}
          />
        );
      })}
    </div>
  );

  function appendCodeToLine(line: Line, code: string): Line {
    setCursorPosition((previousCursorPosition) => {
      line.code =
        line.code.slice(0, previousCursorPosition.column) +
        code.toString() +
        line.code.slice(previousCursorPosition.column, line.code.length);

      return {
        line: previousCursorPosition.line,
        column: previousCursorPosition.column + code.length,
      };
    });
    return line;
  }

  function deleteSingleCharacter(line: Line, charachterIndex: number) {
    if (charachterIndex <= 0 || charachterIndex > line.code.length) return;

    line.code =
      line.code.slice(0, charachterIndex - 1) +
      line.code.slice(charachterIndex, line.code.length);

    setCursorPosition((previousCursorPosition) => ({
      line: previousCursorPosition.line,
      column: charachterIndex - 1,
    }));

    return line;
  }

  function addLine(linesReplica: Line[]) {
    setCursorPosition((previousCursorPosition) => {
      linesReplica.splice(previousCursorPosition.line, 0, { code: "" });
      moveCursor(
        linesReplica.length,
        previousCursorPosition.column,
        linesReplica
      );
      return previousCursorPosition || { column: 0, line: 0 };
    });
  }

  function deleteLine(lineNumber: number, linesReplica: Line[]) {
    if (linesReplica.length <= 1 || lineNumber > linesReplica.length) return;
    setCursorPosition((previousCursorPosition) => {
      linesReplica.splice(lineNumber - 1, 1);
      moveCursor(
        linesReplica.length,
        previousCursorPosition.column,
        linesReplica
      );
      return previousCursorPosition;
    });
  }

  function moveCursor(
    verticalPosition: number,
    horizontalPosition: number,
    lines: Line[]
  ) {
    if (
      horizontalPosition < 0 ||
      verticalPosition <= 0 ||
      verticalPosition > lines.length
    )
      return;

    horizontalPosition = Math.min(
      horizontalPosition,
      lines[verticalPosition - 1].code.length
    );
    setSelectedLine(verticalPosition);
    setCursorPosition({
      line: verticalPosition,
      column: horizontalPosition,
    });
  }

  function handleKeyDown(key: string, selectedLine: number) {
    setLines((previousLines) => {
      const _lines = [...previousLines];
      let line = _lines[selectedLine - 1];

      switch (key) {
        case "Backspace":
          if (line.code.length === 0) deleteLine(selectedLine, _lines);
          else {
            setCursorPosition((previousCursorPosition) => {
              deleteSingleCharacter(line, previousCursorPosition.column);
              return previousCursorPosition || { column: 0, line: 0 };
            });
          }
          break;

        case "Enter":
          addLine(_lines);
          break;

        case "ArrowUp":
          setCursorPosition((previousCursorPosition) => {
            moveCursor(selectedLine - 1, previousCursorPosition.column, _lines);
            return previousCursorPosition;
          });
          break;

        case "ArrowDown":
          setCursorPosition((previousCursorPosition) => {
            moveCursor(selectedLine + 1, previousCursorPosition.column, _lines);
            return previousCursorPosition;
          });
          break;

        case "ArrowRight":
          setCursorPosition((previousCursorPosition) => {
            moveCursor(selectedLine, previousCursorPosition.column + 1, _lines);
            return previousCursorPosition;
          });
          break;

        case "ArrowLeft":
          setCursorPosition((previousCursorPosition) => {
            moveCursor(selectedLine, previousCursorPosition.column - 1, _lines);
            return previousCursorPosition;
          });
          break;

        case "Home":
          setCursorPosition((previousCursorPosition) => ({
            line: previousCursorPosition.line,
            column: 0,
          }));
          break;

        case "End":
          setCursorPosition((previousCursorPosition) => ({
            line: previousCursorPosition.line,
            column: line.code.length,
          }));
          break;

        case "Alt":
        case "AltGraph":
        case "Control":
        case "CapsLock":
        case "Escape":
          break;

        case "Tab":
          appendCodeToLine(line, "  ");
          break;

        default:
          appendCodeToLine(line, key);
          break;
      }

      return _lines;
    });
  }
}

export default CodeEditor;

export type MousePosition = {
  x: number;
  y: number;
};

export type Line = {
  code: string;
};

export type CursorPosition = {
  line: number;
  column: number;
};

let number = 0;
