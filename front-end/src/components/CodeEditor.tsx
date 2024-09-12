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
        handleKeyDown(key);
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
            handleKeyDown(key);
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
    line.code =
      line.code.slice(0, cursorPosition.column) +
      code.toString() +
      line.code.slice(cursorPosition.column, line.code.length);
    setCursorPosition({
      line: selectedLine,
      column: cursorPosition.column + code.length,
    });
    return line;
  }

  function deleteSingleCharacter(line: Line, charachterIndex: number) {
    if (charachterIndex <= 0 || charachterIndex > line.code.length) return;

    line.code =
      line.code.slice(0, charachterIndex - 1) +
      line.code.slice(charachterIndex, line.code.length);

    setCursorPosition({
      line: selectedLine,
      column: charachterIndex - 1,
    });

    return line;
  }

  function addLine(linesReplica: Line[]) {
    linesReplica.splice(cursorPosition.line, 0, { code: "" });
    moveCursor(linesReplica.length, cursorPosition.column, linesReplica);
  }

  function deleteLine(lineNumber: number, linesReplica: Line[]) {
    if (lines.length <= 1 || lineNumber > lines.length) return;
    linesReplica.splice(lineNumber - 1, 1);
    moveCursor(linesReplica.length, cursorPosition.column, linesReplica);
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

  function handleKeyDown(key: string) {
    const _lines = [...lines];
    let line = _lines[selectedLine - 1];

    switch (key) {
      case "Backspace":
        if (line.code.length === 0) deleteLine(selectedLine, _lines);
        else deleteSingleCharacter(line, cursorPosition.column);
        break;

      case "Enter":
        addLine(_lines);
        break;

      case "ArrowUp":
        moveCursor(selectedLine - 1, cursorPosition.column, _lines);
        break;

      case "ArrowDown":
        moveCursor(selectedLine + 1, cursorPosition.column, _lines);
        break;

      case "ArrowRight":
        moveCursor(cursorPosition.line, cursorPosition.column + 1, _lines);
        break;

      case "ArrowLeft":
        moveCursor(cursorPosition.line, cursorPosition.column - 1, _lines);
        break;

      case "Home":
        moveCursor(cursorPosition.line, 0, _lines);
        break;

      case "End":
        moveCursor(cursorPosition.line, Infinity, _lines);
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

    setLines(_lines);
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
