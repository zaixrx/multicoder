import { useContext, useEffect, useRef, useState } from "react";
import { EditorData } from "./CodeEditor";
import { Vector2 } from "../common/Interpolater";
import { Member, Room, RoomContext, RoomContextType } from "../App";
import Cursor from "./Cursor";
import {
  sendMouseClicksBuffer,
  sendKeysPressedBuffer,
  sendMousePosition,
} from "../utils/socketEventHandler";
import Icon, { IconMode } from "../common/Icon";

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

type CursorSelection = {
  start?: CursorPosition;
  end?: CursorPosition;
};

export default function CodeArea({ onCompile }: CodeAreaPropsType) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [room, setRoom, socket] = useContext<RoomContextType>(RoomContext);
  const [absoluteCursorPosition, setAbsoluteCursorPosition] = useState<Vector2>(
    { x: 0, y: 0 }
  );
  const [cursorSelection, setCursorSelection] = useState<CursorSelection>({
    start: undefined,
    end: undefined,
  });

  useEffect(() => {
    initializeSocketEventHandlers();
    setInterval(heartBeat, 1000 / 30);
  }, []);

  useEffect(() => {
    if (!room.selectedFile) return;
    updateAbsoluteCursorPosition();
  }, [room.selectedFile]);

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
    let charachterIndex = cursorPosition.column;
    if (charachterIndex <= 0) return line;

    charachterIndex = Math.min(charachterIndex, line.length);
    cursorPosition.column = charachterIndex - 1;

    return line.slice(0, charachterIndex - 1) + line.slice(charachterIndex);
  }

  function addLine(
    lines: string[],
    cursorPosition: CursorPosition
  ): CursorPosition {
    lines.splice(cursorPosition.line + 1, 0, "");
    return moveCursor({ line: cursorPosition.line + 1 }, cursorPosition, lines);
  }

  function updateCursorSelection(
    selectionStart: CursorPosition,
    cursorPosition: CursorPosition,
    isHoldingShift: boolean
  ) {
    setCursorSelection((prevCursorSelection) => {
      let cursorSelection = { ...prevCursorSelection };

      if (isHoldingShift) {
        if (cursorSelection.start && cursorSelection.end) {
          const { start, end } = ((): {
            start: CursorPosition;
            end: CursorPosition;
          } => {
            if (selectionStart.line === cursorPosition.line) {
              return cursorSelection.start.column <= cursorPosition.column
                ? { start: cursorSelection.start, end: cursorPosition }
                : { start: cursorPosition, end: cursorSelection.end };
            } else {
              return cursorSelection.start.line <= cursorPosition.line
                ? { start: cursorSelection.start, end: cursorPosition }
                : { start: cursorPosition, end: cursorSelection.start };
            }
          })();

          cursorSelection = { start, end };
        } else {
          const { start, end } =
            selectionStart.column <= cursorPosition.column
              ? { start: selectionStart, end: cursorPosition }
              : { start: cursorPosition, end: selectionStart };

          cursorSelection = { start, end };
        }
      } else {
        cursorSelection = { start: undefined, end: undefined };
      }
      return cursorSelection;
    });
  }

  function handleKeyDown(key: string, isHoldingShift: boolean) {
    if (keysToIgnore.includes(key)) return;

    setRoom((previousRoom: Room) => {
      let newRoom = { ...previousRoom };

      if (newRoom.selectedFile) {
        const { selectedFile } = newRoom;

        const currentLine = selectedFile.cursorPosition.line;
        let line = selectedFile.content[currentLine];

        switch (key) {
          case "Backspace":
            const { start, end } = cursorSelection;
            if (start && end) {
              // used to track the number of deleted lines
              // because the loop starts from the first up to the last element
              // we need to delete the lines in between the start and the end of the selection
              // and in order for us to map the currentLine to its corresponding line
              // we need to substract the currentLine by the number of deletedLines also called the offset
              let deletedLines = 0;

              for (
                let currentLine = 0;
                currentLine <= end.line;
                currentLine++
              ) {
                if (start.line === currentLine && end.line === currentLine) {
                  selectedFile.content[currentLine] =
                    line.slice(0, start.column) + line.slice(end.column);
                } else if (start.line === currentLine) {
                  selectedFile.content[currentLine] = selectedFile.content[
                    currentLine
                  ].slice(0, start.column);
                } else if (end.line === currentLine) {
                  selectedFile.content[start.line] += selectedFile.content[
                    Math.min(
                      currentLine - deletedLines,
                      selectedFile.content.length - 1
                    )
                  ].slice(end.column);
                  selectedFile.content.splice(currentLine - deletedLines, 1);
                  deletedLines++;
                } else if (
                  start.line < currentLine &&
                  currentLine < end.line - deletedLines
                ) {
                  selectedFile.content.splice(currentLine, 1);
                  // done to sync deleting data
                  deletedLines++;
                }
              }

              selectedFile.cursorPosition = {
                line: start.line,
                column: start.column,
              };

              setCursorSelection({ start: undefined, end: undefined });
            } else {
              if (line.length) {
                selectedFile.content[currentLine] = deleteSingleCharacter(
                  line,
                  selectedFile.cursorPosition
                );
              } else {
                if (selectedFile.content.length > 1) {
                  selectedFile.content.splice(currentLine, 1);
                  selectedFile.cursorPosition = {
                    line: currentLine - 1,
                    column: selectedFile.content[currentLine - 1].length,
                  };
                }
              }
            }

            break;

          case "Enter":
            selectedFile.cursorPosition = addLine(
              selectedFile.content,
              selectedFile.cursorPosition
            );
            break;

          case "ArrowUp":
            selectedFile.cursorPosition = moveCursor(
              {
                line: currentLine - 1,
                column: selectedFile.cursorPosition.column,
              },
              selectedFile.cursorPosition,
              selectedFile.content
            );

            updateCursorSelection(
              {
                column:
                  cursorSelection.end?.column ||
                  selectedFile.cursorPosition.column,
                line: selectedFile.cursorPosition.line - 1,
              },
              selectedFile.cursorPosition,
              isHoldingShift
            );

            break;

          case "ArrowDown":
            selectedFile.cursorPosition = moveCursor(
              {
                line: currentLine + 1,
                column: selectedFile.cursorPosition.column,
              },
              selectedFile.cursorPosition,
              selectedFile.content
            );

            updateCursorSelection(
              {
                column:
                  cursorSelection.end?.column ||
                  selectedFile.cursorPosition.column,
                line: selectedFile.cursorPosition.line + 1,
              },
              selectedFile.cursorPosition,
              isHoldingShift
            );

            break;

          case "ArrowRight":
            selectedFile.cursorPosition = moveCursor(
              {
                line: currentLine,
                column: selectedFile.cursorPosition.column + 1,
              },
              selectedFile.cursorPosition,
              selectedFile.content
            );

            updateCursorSelection(
              {
                column: selectedFile.cursorPosition.column - 1,
                line: selectedFile.cursorPosition.line,
              },
              selectedFile.cursorPosition,
              isHoldingShift
            );

            break;

          case "ArrowLeft":
            selectedFile.cursorPosition = moveCursor(
              {
                line: currentLine,
                column: selectedFile.cursorPosition.column - 1,
              },
              selectedFile.cursorPosition,
              selectedFile.content
            );

            updateCursorSelection(
              {
                column: selectedFile.cursorPosition.column + 1,
                line: selectedFile.cursorPosition.line,
              },
              selectedFile.cursorPosition,
              isHoldingShift
            );

            break;

          case "Home":
            selectedFile.cursorPosition = moveCursor(
              { line: currentLine, column: 0 },
              selectedFile.cursorPosition,
              selectedFile.content
            );
            break;

          case "End":
            selectedFile.cursorPosition = moveCursor(
              { line: currentLine, column: line.length },
              selectedFile.cursorPosition,
              selectedFile.content
            );
            break;

          case "Tab":
            selectedFile.content[currentLine] = appendCodeToLine(
              line,
              "  ",
              selectedFile.cursorPosition
            );
            break;

          default:
            selectedFile.content[currentLine] = appendCodeToLine(
              line,
              key,
              selectedFile.cursorPosition
            );
            break;
        }
      }

      return newRoom;
    });
  }

  useEffect(() => {
    console.log(room.selectedFile);
  }, [room.selectedFile]);

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
    desiredPosition: { line?: number; column?: number },
    cursorPosition: CursorPosition,
    lines: string[]
  ): CursorPosition {
    if (desiredPosition.line === undefined)
      desiredPosition.line = cursorPosition.line;
    if (desiredPosition.column === undefined)
      desiredPosition.column = cursorPosition.column;

    if (desiredPosition.column < 0 || desiredPosition.line < 0)
      return cursorPosition;

    desiredPosition.line = Math.min(desiredPosition.line, lines.length - 1);
    desiredPosition.column = Math.min(
      desiredPosition.column,
      lines[desiredPosition.line].length
    );

    return desiredPosition as CursorPosition;
  }

  function getNodeAndOffset() {
    if (!room.selectedFile) return { node: null, offset: 0 };

    let charCount = 0;
    let targetNode = null;
    let offset = 0;

    const { column: currentCursorColumn, line: currentCursorLine } =
      room.selectedFile.cursorPosition;

    const editor = editorRef.current;
    if (!editor) return { node: null, offset: 0 };
    // The line might have several children because of the selection
    const children = editor.childNodes[currentCursorLine].childNodes;
    // We want to make it such that if the element doesn't have any children
    // we set both the targetNode and the offest to their corresponding places
    // If a Line existed but it didn't have any text as its children

    if (editor.childNodes[currentCursorLine].childNodes.length) {
      for (const child of children) {
        targetNode = child;
        if (child.textContent) {
          const textLength = child.textContent.length;
          if (charCount + textLength >= currentCursorColumn) {
            offset = currentCursorColumn - charCount;
            break;
          }
          charCount += textLength;
        }
      }
    } else {
      targetNode = editor.childNodes[currentCursorLine];
    }

    return { node: targetNode, offset };
  }

  function updateAbsoluteCursorPosition() {
    if (!editorRef.current) return;
    let rect: DOMRect = {} as DOMRect;

    const { node, offset } = getNodeAndOffset();

    if (!node) return;

    if (
      node.nodeType === Node.TEXT_NODE ||
      (node.nodeType === Node.ELEMENT_NODE && node.firstChild)
    ) {
      const range = document.createRange();
      const selection = window.getSelection();

      range.setStart(node.firstChild || node, offset);
      range.collapse(true);

      selection?.removeAllRanges();
      selection?.addRange(range);

      rect = range.getBoundingClientRect();
    } else {
      rect = (node as HTMLElement).getBoundingClientRect();
    }

    setAbsoluteCursorPosition({
      x: rect.left,
      y: rect.top,
    });
  }

  function renderCode() {
    if (!room.selectedFile) return;

    const getLineClasses = (index: number) =>
      `line ${
        index === room.selectedFile?.cursorPosition.line && " line-highlited"
      }`;

    return room.selectedFile.content.map(
      (code: string, currentLine: number) => {
        return (
          <pre key={currentLine} className={getLineClasses(currentLine)}>
            {(() => {
              const { start, end } = cursorSelection;

              if (start && end) {
                if (start.line === currentLine && end.line === currentLine) {
                  return (
                    <>
                      {code.slice(0, start.column)}
                      <span className="selection">
                        {code.slice(start.column, end.column)}
                      </span>
                      {code.slice(end.column)}
                    </>
                  );
                } else if (start.line === currentLine) {
                  return (
                    <>
                      {code.slice(0, start.column)}
                      <span className="selection">
                        {code.slice(start.column)}
                      </span>
                    </>
                  );
                } else if (end.line === currentLine) {
                  return (
                    <>
                      <span className="selection">
                        {code.slice(0, end.column)}
                      </span>
                      {code.slice(end.column)}
                    </>
                  );
                } else if (start.line < currentLine && currentLine < end.line) {
                  return <span className="selection">{code}</span>;
                }
              }

              return code;
            })()}
          </pre>
        );
      }
    );
  }

  return (
    room.selectedFile && (
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
        <button>
          <Icon
            onClick={() => onCompile(room.selectedFile?.content)}
            mode={IconMode.Light}
            name="run.svg"
            width={20}
          />
        </button>
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
            {room.selectedFile.content.map((_line: string, index: number) => (
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
    )
  );
}

export type MouseClick = {
  type: string;
  position: Vector2;
};
