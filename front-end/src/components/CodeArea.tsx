import Cursor from "./Cursor";
import { useContext } from "react";
import { CodeEditorContext, Line } from "./CodeEditor";

export type CodeAreaPropsType = {
  onCompile: Function;
  onKeyDown: Function;
  moveCursor: Function;
};

export default function CodeArea({
  onCompile,
  onKeyDown,
  moveCursor,
}: CodeAreaPropsType) {
  const { lines, selectedLine, cursorPosition } = useContext(CodeEditorContext);

  return (
    <>
      <button onClick={() => onCompile(lines)}>Compile</button>
      <div
        tabIndex={0}
        onKeyDown={(e) => {
          e.preventDefault();
          onKeyDown(e.key);
        }}
        className="d-flex"
      >
        <div className="d-flex flex-column align-items-center line-counter">
          {lines.map((_line: Line, index: number) => (
            <span key={index}>{index + 1}</span>
          ))}
        </div>
        <div className="position-relative d-flex flex-column flex-grow-1 code-area">
          <Cursor position={cursorPosition} />
          {lines.map((line: Line, index: number) => (
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
    </>
  );
}
