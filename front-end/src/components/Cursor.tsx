import { CursorPosition } from "./CodeEditor";

export interface CursorPropsType {
  position: CursorPosition;
}

function Cursor({ position }: CursorPropsType) {
  return (
    <div
      className="cursor-bar"
      style={{ left: position.column * 9, top: (position.line - 1) * 24 }}
    />
  );
}

export default Cursor;
