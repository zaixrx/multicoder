import { useContext, useEffect, useRef, useState } from "react";
import { CodeEditorContext, EditorData } from "./CodeEditor";
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

const keysToIgnore = [
  "Insert",
  "Delete",
  "PageUp",
  "PageDown",
  "PrintScreen",
  "ScrollLock",
  "NumLock",
  "Shift",
  "Control",
  "Alt",
  "AltGraph",
  "Pause",
  "CapsLock",
  "Escape",
  "Meta",
];

let previousMousePosition: Vector2 = { x: 0, y: 0 };
let myMousePosition: Vector2 = { x: 0, y: 0 };
let myMouseClicksBuffer: MouseClick[] = [];
let myKeysPressedBuffer: { key: string; isShifting: boolean }[] = [];
let intitializationFlag: boolean = false;

export default function CodeArea({ onCompile }: CodeAreaPropsType) {
  const [room, setRoom, socket] = useContext(RoomContext);

  const {
    editorData,
    setEditorData,
  }: { editorData: EditorData; setEditorData: any } =
    useContext(CodeEditorContext);

  const editorRef = useRef<HTMLDivElement>(null);
  const [absoluteCursorPosition, setAbsoluteCursorPosition] = useState<Vector2>(
    { x: 0, y: 0 }
  );

  const [cursorSelection, setCursorSelection] = useState<{
    start?: CursorPosition;
    end?: CursorPosition;
  }>({ start: undefined, end: undefined });

  useEffect(() => {
    initializeSocketEventHandlers();
    setInterval(heartBeat, 1000 / 30);
  }, []);

  useEffect(() => {
    updateAbsoluteCursorPosition();
  }, [editorData]);

  function initializeSocketEventHandlers() {
    if (!socket || intitializationFlag) return;
    intitializationFlag = true;

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

    socket.on(
      "keysPressed",
      (
        _socketId: string,
        keysPressed: { key: string; isShifting: boolean }[]
      ) => {
        keysPressed.forEach(({ key, isShifting }) => {
          handleKeyDown(key, isShifting);
        });
      }
    );

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
    line: string,
    codeToAppend: string,
    cursorPosition: CursorPosition
  ) {
    cursorPosition.column += codeToAppend.length;

    return (
      line.slice(0, cursorPosition.column - 1) +
      codeToAppend +
      line.slice(cursorPosition.column - 1)
    );
  }

  function deleteSingleCharacter(line: string, cursorPosition: CursorPosition) {
    if (cursorSelection.start && cursorSelection.end) {
      const start = Math.min(
        cursorSelection.start.column || 0,
        cursorSelection.end.column || 0
      );
      const end = Math.max(
        cursorSelection.start.column || 0,
        cursorSelection.end.column || 0
      );

      return line.slice(0, start) + line.slice(end);
    } else {
      let charachterIndex = cursorPosition.column;
      if (charachterIndex <= 0) return line;

      charachterIndex = Math.min(charachterIndex, line.length);
      cursorPosition.column = charachterIndex - 1;

      return line.slice(0, charachterIndex - 1) + line.slice(charachterIndex);
    }
  }

  function addLine(
    lines: string[],
    cursorPosition: CursorPosition
  ): CursorPosition {
    lines.splice(cursorPosition.line + 1, 0, "");
    return moveCursor(
      { line: cursorPosition.line + 1, column: cursorPosition.column },
      cursorPosition,
      lines
    );
  }

  function handleKeyDown(key: string, isShifting: boolean) {
    if (keysToIgnore.includes(key)) return;

    if (!isShifting) setCursorSelection({ start: undefined, end: undefined });

    setEditorData((prevEditorData: EditorData) => {
      let { lines, cursorPosition } = { ...prevEditorData };
      const selectedLine = cursorPosition.line;
      let line: string = lines[selectedLine] || "";

      switch (key) {
        case "Backspace":
          if (line.length)
            lines[selectedLine] = deleteSingleCharacter(line, cursorPosition);
          else {
            if (selectedLine && lines.length > 1) {
              lines.splice(selectedLine, 1);
              cursorPosition = {
                line: selectedLine - 1,
                column: lines[selectedLine - 1].length,
              };
            }
          }
          break;

        case "Enter":
          cursorPosition = addLine(lines, cursorPosition);
          break;

        case "ArrowUp":
          cursorPosition = moveCursor(
            { line: selectedLine - 1, column: cursorPosition.column },
            cursorPosition,
            lines
          );

          setCursorSelection((prevCursorSelection) => {
            let cursorSelection = { ...prevCursorSelection };

            if (isShifting) {
              if (cursorSelection.start) {
                cursorSelection.end = cursorPosition;
              } else {
                cursorSelection = {
                  start: {
                    column: cursorPosition.column - 1,
                    line: cursorPosition.line,
                  },
                  end: {
                    column: cursorPosition.column,
                    line: cursorPosition.line,
                  },
                };
              }
            }

            return cursorSelection;
          });
          break;

        case "ArrowDown":
          cursorPosition = moveCursor(
            { line: selectedLine + 1, column: cursorPosition.column },
            cursorPosition,
            lines
          );

          setCursorSelection((prevCursorSelection) => {
            let cursorSelection = { ...prevCursorSelection };

            if (isShifting) {
              if (cursorSelection.start) {
                cursorSelection.end = cursorPosition;
              } else {
                cursorSelection = {
                  start: {
                    column: cursorPosition.column - 1,
                    line: cursorPosition.line,
                  },
                  end: {
                    column: cursorPosition.column,
                    line: cursorPosition.line,
                  },
                };
              }
            }

            return cursorSelection;
          });

          break;

        case "ArrowRight":
          cursorPosition = moveCursor(
            { line: selectedLine, column: cursorPosition.column + 1 },
            cursorPosition,
            lines
          );

          setCursorSelection((prevCursorSelection) => {
            let cursorSelection = { ...prevCursorSelection };

            if (isShifting) {
              if (cursorSelection.start) {
                cursorSelection.end = cursorPosition;
              } else {
                cursorSelection = {
                  start: {
                    column: cursorPosition.column - 1,
                    line: cursorPosition.line,
                  },
                  end: {
                    column: cursorPosition.column,
                    line: cursorPosition.line,
                  },
                };
              }
            }

            return cursorSelection;
          });

          break;

        case "ArrowLeft":
          cursorPosition = moveCursor(
            { line: selectedLine, column: cursorPosition.column - 1 },
            cursorPosition,
            lines
          );

          setCursorSelection((prevCursorSelection) => {
            let cursorSelection = { ...prevCursorSelection };

            if (isShifting) {
              if (cursorSelection.start) {
                cursorSelection.end = cursorPosition;
              } else {
                cursorSelection = {
                  start: {
                    column: cursorPosition.column + 1,
                    line: cursorPosition.line,
                  },
                  end: {
                    column: cursorPosition.column,
                    line: cursorPosition.line,
                  },
                };
              }
            }

            return cursorSelection;
          });
          break;

        case "Home":
          if (isShifting) {
            let intialCursorColumn = cursorPosition.column;

            setCursorSelection((prevCursorSelection) => {
              let cursorSelection = { ...prevCursorSelection };

              cursorSelection = {
                start: {
                  column: intialCursorColumn,
                  line: cursorPosition.line,
                },
                end: {
                  column: 0,
                  line: cursorPosition.line,
                },
              };

              return cursorSelection;
            });
          }

          cursorPosition = moveCursor(
            { line: selectedLine, column: 0 },
            cursorPosition,
            lines
          );
          break;

        case "End":
          if (isShifting) {
            let intialCursorColumn = cursorPosition.column;

            setCursorSelection((prevCursorSelection) => {
              let cursorSelection = { ...prevCursorSelection };

              cursorSelection = {
                start: {
                  column: intialCursorColumn,
                  line: cursorPosition.line,
                },
                end: {
                  column: line.length,
                  line: cursorPosition.line,
                },
              };

              return cursorSelection;
            });
          }

          cursorPosition = moveCursor(
            { line: selectedLine, column: line.length },
            cursorPosition,
            lines
          );

          break;

        case "Tab":
          lines[selectedLine] = appendCodeToLine(line, "  ", cursorPosition);
          break;

        default:
          lines[selectedLine] = appendCodeToLine(line, key, cursorPosition);
          break;
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
      if (element.id !== "clickable") return;
      element.click();
    }
  }

  function moveCursor(
    desiredPosition: CursorPosition,
    cursorPosition: CursorPosition,
    lines: string[]
  ): CursorPosition {
    if (desiredPosition.column < 0 || desiredPosition.line < 0)
      return cursorPosition;

    desiredPosition.line = Math.min(desiredPosition.line, lines.length - 1);

    desiredPosition.column = Math.min(
      desiredPosition.column,
      lines[desiredPosition.line].length
    );

    return desiredPosition;
  }

  function getNodeAndOffset() {
    let charCount = 0;
    let targetNode = null;
    let offset = 0;

    const { column: currentCursorColumn, line: currentCursorLine } =
      editorData.cursorPosition;

    const editor = editorRef.current;
    if (!editor) return { node: null, offset: 0 };
    const children = editor.childNodes[currentCursorLine].childNodes;

    for (const child of children) {
      if (!child.textContent) continue;
      const textLength = child.textContent.length;
      if (charCount + textLength >= currentCursorColumn) {
        targetNode = child;
        offset = currentCursorColumn - charCount;
        break;
      }
      charCount += textLength;
    }

    return { node: targetNode, offset };
  }

  function updateAbsoluteCursorPosition() {
    if (!editorRef.current) return;

    const range = document.createRange();
    const selection = window.getSelection();

    const { node, offset } = getNodeAndOffset();
    if (!node) return;

    if (node.nodeType === Node.TEXT_NODE) {
      range.setStart(node, offset);
    } else if (node.nodeType === Node.ELEMENT_NODE && node.firstChild) {
      range.setStart(node.firstChild, offset);
    }

    range.collapse(true);

    selection?.removeAllRanges();
    selection?.addRange(range);

    const rect = range.getBoundingClientRect();

    setAbsoluteCursorPosition({
      x: rect.left,
      y: rect.top,
    });
  }

  function renderCode() {
    const getLineClasses = (index: number) =>
      `line ${index === editorData.cursorPosition.line && " line-highlited"}`;

    const startColumn = Math.min(
      cursorSelection.start?.column || 0,
      cursorSelection.end?.column || 0
    );
    const endColumn = Math.max(
      cursorSelection.start?.column || 0,
      cursorSelection.end?.column || 0
    );

    return editorData.lines.map((code: string, lineNumber: number) => {
      const sameStartLine = cursorSelection.start?.line === lineNumber;
      const sameEndLine = cursorSelection.end?.line === lineNumber;

      if (sameStartLine && sameEndLine) {
        return (
          <pre key={lineNumber} className={getLineClasses(lineNumber)}>
            <>
              {code.slice(0, startColumn)}
              <span className="selection">
                {code.slice(startColumn, endColumn)}
              </span>
              {code.slice(endColumn)}
            </>
          </pre>
        );
      } else if (sameStartLine && !sameEndLine) {
        return (
          <pre key={lineNumber} className={getLineClasses(lineNumber)}>
            <>
              {code.slice(0, startColumn)}
              <span className="selection">{code.slice(startColumn)}</span>
            </>
          </pre>
        );
      } else if (!sameStartLine && sameEndLine) {
        return (
          <pre key={lineNumber} className={getLineClasses(lineNumber)}>
            <>
              <span className="selection">{code.slice(0, endColumn)}</span>
              {code.slice(endColumn)}
            </>
          </pre>
        );
      }

      return (
        <pre key={lineNumber} className={getLineClasses(lineNumber)}>
          {code}
        </pre>
      );
    });
  }

  return (
    <div
      className="fill-screen"
      onMouseDown={(e) => {
        myMouseClicksBuffer.push({
          type: (e.button === 0 && "LMB") || (e.button === 2 && "RMB") || "",
          position: { x: e.clientX, y: e.clientY },
        });
      }}
      onMouseMove={(e) => (myMousePosition = { x: e.clientX, y: e.clientY })}
    >
      <button onClick={() => onCompile(editorData.lines)}>Compile</button>
      <div
        tabIndex={0}
        onKeyDown={(e) => {
          e.preventDefault();
          myKeysPressedBuffer.push({ key: e.key, isShifting: e.shiftKey });
          handleKeyDown(e.key, e.shiftKey);
        }}
        className="d-flex"
      >
        <div className="d-flex flex-column align-items-center line-counter">
          {editorData.lines.map((_line: string, index: number) => (
            <span key={index}>{index + 1}</span>
          ))}
        </div>
        <Cursor position={absoluteCursorPosition} />
        <div
          ref={editorRef}
          className="d-flex flex-column flex-grow-1 code-area"
        >
          {renderCode()}
        </div>
      </div>
    </div>
  );
}

export type MouseClick = {
  type: string;
  position: Vector2;
};
