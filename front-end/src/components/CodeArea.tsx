import { KeyboardEvent, useState } from "react";
import Cursor from "./Cursor";

export interface Line {
  code: string;
}

export type CursorPosition = {
  line: number;
  column: number;
};

export interface CodeAreaPropsType {
  onCompile: Function;
}

export default function CodeArea({ onCompile }: CodeAreaPropsType) {
  const [lines, setLines] = useState<Line[]>([
    { code: "function say_hello() {" },
    { code: "  alert('hello, world');" },
    { code: "}" },
    { code: "say_hello();" },
  ]);
  const [selectedLine, setSelectedLine] = useState<number>(1);
  const [cursorPosition, setCursorPosition] = useState<CursorPosition>({
    line: 1,
    column: 0,
  });

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

  function addLine(linesReplica: Line[]) {
    linesReplica.splice(cursorPosition.line, 0, { code: "" });
    moveCursorVertically(linesReplica.length, linesReplica.length);
  }

  function deleteLine(lineNumber: number, linesReplica: Line[]) {
    if (lineNumber < 0 || lineNumber > lines.length) return;
    linesReplica.splice(lineNumber - 1, 1);
    moveCursorVertically(linesReplica.length, lineNumber - 1);
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

  function moveCursorVertically(
    linesCount: number,
    lineToSelectNumber: number
  ) {
    if (lineToSelectNumber <= 0 || lineToSelectNumber > linesCount) return;
    setSelectedLine(lineToSelectNumber);
    setCursorPosition({
      line: lineToSelectNumber,
      column: 0,
    });
  }

  function moveCursorHorizontally(desiredColumnPosition: number) {
    if (desiredColumnPosition < 0) return;

    desiredColumnPosition = Math.min(
      desiredColumnPosition,
      lines[selectedLine - 1].code.length
    );

    setCursorPosition({ line: selectedLine, column: desiredColumnPosition });
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    e.preventDefault();

    const _lines = [...lines];
    let line = _lines[selectedLine - 1];

    switch (e.key) {
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
        moveCursorHorizontally(cursorPosition.column + 1);
        break;

      case "ArrowLeft":
        moveCursorHorizontally(cursorPosition.column - 1);
        break;

      case "Home":
        moveCursorHorizontally(0);
        break;

      case "End":
        moveCursorHorizontally(lines[selectedLine - 1].code.length);
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
        appendCodeToLine(line, e.key);
        break;
    }

    setLines(_lines);
  }

  return (
    <main>
      <button onClick={() => onCompile(lines)}>Compile</button>
      <div tabIndex={0} onKeyDown={handleKeyDown} className="d-flex">
        <div className="d-flex flex-column align-items-center line-counter">
          {lines.map((_line, index) => (
            <span key={index}>{index + 1}</span>
          ))}
        </div>
        <div className="position-relative d-flex flex-column flex-grow-1 code-area">
          <Cursor position={cursorPosition} />
          {lines.map((line, index) => (
            <pre
              onMouseDown={(e) => {
                moveCursor(index + 1, Math.ceil((e.clientX - 42) / 9), lines);
              }}
              key={index}
              className={`line${
                index + 1 === selectedLine ? " line-highlited" : ""
              }`}
            >
              <span>{line.code}</span>
            </pre>
          ))}
        </div>
      </div>
    </main>
  );
}
