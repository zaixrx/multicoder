import { useContext, useEffect, useRef, useState } from "react";
import { FileNode } from "../../assets/directoryTree";
import { CodeEditorContext } from "../Managers/CodeEditorManager";
import Cursor from "../Cursor";
import Icon from "../../common/Icon";
import { Vector2 } from "../../assets/types/messageTypes";

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

function CodeEditor() {
  const { selectedFile, setSelectedFile, interpretJSCode } =
    useContext(CodeEditorContext);

  const editorRef = useRef<HTMLDivElement>(null);
  const [absoluteCursorPosition, setAbsoluteCursorPosition] = useState<Vector2>(
    { x: 0, y: 0 }
  );

  useEffect(() => {
    updateAbsoluteCursorPosition();
  }, [selectedFile]);

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
    selectedFile: FileNode,
    selectionStart: CursorPosition,
    isHoldingShift: boolean
  ) {
    const { cursorPosition } = selectedFile;

    if (isHoldingShift) {
      if (
        selectedFile.cursorSelection.start &&
        selectedFile.cursorSelection.end
      ) {
        const { start, end } = ((): {
          start: CursorPosition;
          end: CursorPosition;
        } => {
          if (selectionStart.line === cursorPosition.line) {
            return selectedFile.cursorSelection.start.column <=
              cursorPosition.column
              ? {
                  start: selectedFile.cursorSelection.start,
                  end: cursorPosition,
                }
              : {
                  start: cursorPosition,
                  end: selectedFile.cursorSelection.end,
                };
          } else {
            return selectedFile.cursorSelection.start.line <=
              cursorPosition.line
              ? {
                  start: selectedFile.cursorSelection.start,
                  end: cursorPosition,
                }
              : {
                  start: cursorPosition,
                  end: selectedFile.cursorSelection.start,
                };
          }
        })();

        selectedFile.cursorSelection = { start, end };
      } else {
        const { start, end } =
          selectionStart.column <= cursorPosition.column
            ? { start: selectionStart, end: cursorPosition }
            : { start: cursorPosition, end: selectionStart };

        selectedFile.cursorSelection = { start, end };
      }
    } else {
      selectedFile.cursorSelection = {};
    }
  }

  function handleKeyDown(key: string, isHoldingShift: boolean) {
    if (keysToIgnore.includes(key)) return;

    setSelectedFile((previousSelectedFile: FileNode) => {
      let newSelectedFile = { ...previousSelectedFile };

      if (newSelectedFile.indexes) {
        const currentLine = newSelectedFile.cursorPosition.line;
        let line = newSelectedFile.content[currentLine];

        switch (key) {
          case "Backspace":
            const { start, end } = newSelectedFile.cursorSelection;
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
                  newSelectedFile.content[currentLine] =
                    line.slice(0, start.column) + line.slice(end.column);
                } else if (start.line === currentLine) {
                  newSelectedFile.content[currentLine] =
                    newSelectedFile.content[currentLine].slice(0, start.column);
                } else if (end.line === currentLine) {
                  newSelectedFile.content[start.line] +=
                    newSelectedFile.content[
                      Math.min(
                        currentLine - deletedLines,
                        newSelectedFile.content.length - 1
                      )
                    ].slice(end.column);
                  newSelectedFile.content.splice(currentLine - deletedLines, 1);
                  deletedLines++;
                } else if (
                  start.line < currentLine &&
                  currentLine < end.line - deletedLines
                ) {
                  newSelectedFile.content.splice(currentLine, 1);
                  // done to sync deleting data
                  deletedLines++;
                }
              }

              newSelectedFile.cursorPosition = {
                line: start.line,
                column: start.column,
              };

              newSelectedFile.cursorSelection = {};
            } else {
              if (line.length) {
                newSelectedFile.content[currentLine] = deleteSingleCharacter(
                  line,
                  newSelectedFile.cursorPosition
                );
              } else {
                if (newSelectedFile.content.length > 1) {
                  newSelectedFile.content.splice(currentLine, 1);
                  newSelectedFile.cursorPosition = {
                    line: currentLine - 1,
                    column: newSelectedFile.content[currentLine - 1].length,
                  };
                }
              }
            }

            break;

          case "Enter":
            newSelectedFile.cursorPosition = addLine(
              newSelectedFile.content,
              newSelectedFile.cursorPosition
            );
            break;

          case "ArrowUp":
            newSelectedFile.cursorPosition = moveCursor(
              {
                line: currentLine - 1,
                column: newSelectedFile.cursorPosition.column,
              },
              newSelectedFile.cursorPosition,
              newSelectedFile.content
            );

            updateCursorSelection(
              newSelectedFile,
              {
                column:
                  newSelectedFile.cursorSelection.end?.column ||
                  newSelectedFile.cursorPosition.column,
                line: newSelectedFile.cursorPosition.line - 1,
              },
              isHoldingShift
            );

            break;

          case "ArrowDown":
            newSelectedFile.cursorPosition = moveCursor(
              {
                line: currentLine + 1,
                column: newSelectedFile.cursorPosition.column,
              },
              newSelectedFile.cursorPosition,
              newSelectedFile.content
            );

            updateCursorSelection(
              newSelectedFile,
              {
                column:
                  newSelectedFile.cursorSelection.end?.column ||
                  newSelectedFile.cursorPosition.column,
                line: newSelectedFile.cursorPosition.line + 1,
              },
              isHoldingShift
            );

            break;

          case "ArrowRight":
            newSelectedFile.cursorPosition = moveCursor(
              {
                line: currentLine,
                column: newSelectedFile.cursorPosition.column + 1,
              },
              newSelectedFile.cursorPosition,
              newSelectedFile.content
            );

            updateCursorSelection(
              newSelectedFile,
              {
                column: newSelectedFile.cursorPosition.column - 1,
                line: newSelectedFile.cursorPosition.line,
              },
              isHoldingShift
            );

            break;

          case "ArrowLeft":
            newSelectedFile.cursorPosition = moveCursor(
              {
                line: currentLine,
                column: newSelectedFile.cursorPosition.column - 1,
              },
              newSelectedFile.cursorPosition,
              newSelectedFile.content
            );

            updateCursorSelection(
              newSelectedFile,
              {
                column: newSelectedFile.cursorPosition.column + 1,
                line: newSelectedFile.cursorPosition.line,
              },
              isHoldingShift
            );

            break;

          case "Home":
            newSelectedFile.cursorPosition = moveCursor(
              { line: currentLine, column: 0 },
              newSelectedFile.cursorPosition,
              newSelectedFile.content
            );
            break;

          case "End":
            newSelectedFile.cursorPosition = moveCursor(
              { line: currentLine, column: line.length },
              newSelectedFile.cursorPosition,
              newSelectedFile.content
            );
            break;

          case "Tab":
            newSelectedFile.content[currentLine] = appendCodeToLine(
              line,
              "  ",
              newSelectedFile.cursorPosition
            );
            break;

          default:
            newSelectedFile.content[currentLine] = appendCodeToLine(
              line,
              key,
              newSelectedFile.cursorPosition
            );
            break;
        }
      }

      return newSelectedFile;
    });
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
    if (!selectedFile) return { node: null, offset: 0 };

    let charCount = 0;
    let targetNode = null;
    let offset = 0;

    const { column: currentCursorColumn, line: currentCursorLine } =
      selectedFile.cursorPosition;

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
    const getLineClasses = (index: number) =>
      `line ${
        index === selectedFile?.cursorPosition.line && " line-highlited"
      }`;

    return selectedFile.content.map((code: string, currentLine: number) => {
      return (
        <pre key={currentLine} className={getLineClasses(currentLine)}>
          {(() => {
            const { start, end } = selectedFile.cursorSelection;

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
    });
  }

  return (
    selectedFile && (
      <div className="fill-screen-horizontally">
        <button onClick={() => interpretJSCode(selectedFile.content)}>
          <Icon name="run.svg" width={20} />
        </button>
        <div
          tabIndex={0}
          onKeyDown={(e) => {
            e.preventDefault();
            handleKeyDown(e.key, e.shiftKey);
          }}
          className="d-flex"
        >
          <div className="d-flex flex-column align-items-center line-counter">
            {selectedFile.content.map((_line: string, index: number) => (
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

export type CursorPosition = {
  line: number;
  column: number;
};

export type CursorSelection = {
  start?: CursorPosition;
  end?: CursorPosition;
};

export default CodeEditor;
