import { Vector2 } from "../common/Interpolater";

export interface CursorPropsType {
  position: Vector2;
}

function Cursor({ position }: CursorPropsType) {
  return (
    <div className="cursor-bar" style={{ left: position.x, top: position.y }} />
  );
}

export default Cursor;
