import { useContext, useEffect } from "react";
import { CodeEditorContext, Line, EditorData } from "./CodeEditor";
import { Vector2 } from "../common/Interpolater";
import { Member, Room, RoomContext } from "../App";
import Cursor from "./Cursor";
import {
  sendMouseClicksBuffer,
  sendKeysPressedBuffer,
  sendMousePosition,
} from "../utils/socketEventHandler";

export type CursorPosition = {
  line: number;
  column: number;
};

export type CodeAreaPropsType = {
  onCompile: Function;
};

let previousMousePosition: Vector2 = { x: 0, y: 0 };
let myMousePosition: Vector2 = { x: 0, y: 0 };
let myMouseClicksBuffer: MouseClick[] = [];
let myKeysPressedBuffer: string[] = [];

let init: boolean = false;

export default function CodeArea({ onCompile }: CodeAreaPropsType) {
  const {
    editorData,
    setEditorData,
  }: { editorData: EditorData; setEditorData: any } =
    useContext(CodeEditorContext);

  const [room, setRoom, socket] = useContext(RoomContext);

  useEffect(() => {
    initializeSocketEventHandlers();
    setInterval(heartBeat, 1000 / 30);
  }, []);

  function initializeSocketEventHandlers() {
    if (!socket || init) return;
    init = true;

    socket.on("mousePosition", (socketId: string, mousePosition: Vector2) => {
      setRoom((room: Room) => {
        const _room: Room = { ...room };

        if (_room) {
          if (_room.members) {
            const member = _room.members.find((m: Member) => m.id === socketId);
            if (member) {
              member.mousePositionBuffer.enqueue(mousePosition);
            }
          }
        }

        return _room;
      });
    });

    socket.on("keysPressed", (_socketId: string, keysPressed: string[]) => {
      keysPressed.forEach((key) => {
        handleKeyDown(key);
      });
    });

    socket.on("mouseClicks", (_socketId: string, mouseClicks: MouseClick[]) => {
      mouseClicks.forEach((click) => {
        handleMouseDown(click);
      });
    });
  }

  function heartBeat() {
    if (
      myMousePosition.x !== previousMousePosition.x ||
      myMousePosition.y !== previousMousePosition.y
    ) {
      sendMousePosition(room.id, myMousePosition);
      previousMousePosition = myMousePosition;
    }

    if (myKeysPressedBuffer.length) {
      sendKeysPressedBuffer(room.id, myKeysPressedBuffer);
      myKeysPressedBuffer = [];
    }

    if (myMouseClicksBuffer.length) {
      sendMouseClicksBuffer(room.id, myMouseClicksBuffer);
      myMouseClicksBuffer = [];
    }
  }

  function appendCodeToLine(
    line: Line,
    codeToAppend: string,
    cursorPosition: CursorPosition
  ) {
    line.code =
      line.code.slice(0, cursorPosition.column) +
      codeToAppend.toString() +
      line.code.slice(cursorPosition.column, line.code.length);

    cursorPosition.column += codeToAppend.length;
  }

  function deleteSingleCharacter(line: Line, cursorPosition: CursorPosition) {
    let charachterIndex = cursorPosition.column;
    if (charachterIndex <= 0) return;

    charachterIndex = Math.min(charachterIndex, line.code.length);

    line.code =
      line.code.slice(0, charachterIndex - 1) +
      line.code.slice(charachterIndex, line.code.length);

    cursorPosition.column = charachterIndex - 1;
  }

  function addLine(
    lines: Line[],
    cursorPosition: CursorPosition
  ): CursorPosition {
    lines.splice(cursorPosition.line, 0, { code: "" });
    return moveCursor(
      { line: lines.length, column: cursorPosition.column },
      cursorPosition,
      lines
    );
  }

  function deleteLine(
    lines: Line[],
    cursorPosition: CursorPosition
  ): CursorPosition {
    if (lines.length <= 1 || cursorPosition.line > lines.length)
      return cursorPosition;
    lines.splice(cursorPosition.line - 1, 1);
    let returnValue = moveCursor(
      { line: lines.length, column: Infinity },
      cursorPosition,
      lines
    );
    console.log("return value", returnValue);
    return returnValue;
  }

  function handleKeyDown(key: string) {
    setEditorData((prevEditorData: EditorData) => {
      let { lines, cursorPosition } = { ...prevEditorData };
      let line: Line = lines[cursorPosition.line - 1];

      if (line) {
        switch (key) {
          case "Backspace":
            if (line.code.length === 0)
              cursorPosition = deleteLine(lines, cursorPosition);
            else deleteSingleCharacter(line, cursorPosition);
            break;

          case "Enter":
            cursorPosition = addLine(lines, cursorPosition);
            break;

          case "ArrowUp":
            cursorPosition = moveCursor(
              { line: cursorPosition.line - 1, column: cursorPosition.column },
              cursorPosition,
              lines
            );
            break;

          case "ArrowDown":
            cursorPosition = moveCursor(
              { line: cursorPosition.line + 1, column: cursorPosition.column },
              cursorPosition,
              lines
            );
            break;

          case "ArrowRight":
            cursorPosition = moveCursor(
              { line: cursorPosition.line, column: cursorPosition.column + 1 },
              cursorPosition,
              lines
            );
            break;

          case "ArrowLeft":
            cursorPosition = moveCursor(
              { line: cursorPosition.line, column: cursorPosition.column - 1 },
              cursorPosition,
              lines
            );
            break;

          case "Home":
            cursorPosition = moveCursor(
              { line: cursorPosition.line, column: 0 },
              cursorPosition,
              lines
            );
            break;

          case "End":
            cursorPosition = moveCursor(
              { line: cursorPosition.line, column: line.code.length },
              cursorPosition,
              lines
            );
            break;

          case "Alt":
          case "AltGraph":
          case "Shift":
          case "Control":
          case "CapsLock":
          case "Escape":
            break;

          case "Tab":
            appendCodeToLine(line, "  ", cursorPosition);
            break;

          default:
            appendCodeToLine(line, key, cursorPosition);
            break;
        }
      }

      return { lines, cursorPosition };
    });
  }

  function handleMouseDown(click: MouseClick) {
    const elements = document.elementsFromPoint(
      click.position.x,
      click.position.y
    ) as HTMLElement[];
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      if (element.className.includes("mouse-cursor")) continue;
      element?.click();
      break;
    }
  }

  function moveCursor(
    desiredPosition: CursorPosition,
    cursorPosition: CursorPosition,
    lines: Line[]
  ): CursorPosition {
    if (desiredPosition.column < 0 || desiredPosition.line <= 0)
      return cursorPosition;

    desiredPosition.column = Math.min(
      desiredPosition.column,
      lines[desiredPosition.line - 1].code.length
    );

    desiredPosition.line = Math.min(desiredPosition.line, lines.length);

    return desiredPosition;
  }

  return (
    <div
      className="fill-screen"
      onMouseDown={(e) =>
        myMouseClicksBuffer.push({
          type: (e.button === 0 && "LMB") || (e.button === 2 && "RMB") || "",
          position: { x: e.clientX, y: e.clientY },
        })
      }
      onMouseMove={(e) => (myMousePosition = { x: e.clientX, y: e.clientY })}
    >
      <button onClick={() => onCompile(editorData.lines)}>Compile</button>
      <div
        tabIndex={0}
        onKeyDown={(e) => {
          e.preventDefault();
          myKeysPressedBuffer.push(e.key);
          handleKeyDown(e.key);
        }}
        className="d-flex"
      >
        <div className="d-flex flex-column align-items-center line-counter">
          {editorData.lines.map((_line: Line, index: number) => (
            <span key={index}>{index + 1}</span>
          ))}
        </div>
        <div className="position-relative d-flex flex-column flex-grow-1 code-area">
          <Cursor position={editorData.cursorPosition} />
          {editorData.lines.map((line: Line, index: number) => (
            <pre
              onMouseDown={(e) => {
                const _editorData = { ...editorData };

                _editorData.cursorPosition = moveCursor(
                  { column: Math.ceil((e.clientX - 42) / 9), line: index + 1 },
                  editorData.cursorPosition,
                  editorData.lines
                );

                setEditorData(_editorData);
              }}
              key={index}
              className={`line${
                index + 1 === editorData.cursorPosition.line
                  ? " line-highlited"
                  : ""
              }`}
            >
              <span>{line.code}</span>
            </pre>
          ))}
        </div>
      </div>
    </div>
  );
}

export type MouseClick = {
  type: string;
  position: Vector2;
};
