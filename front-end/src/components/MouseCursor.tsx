import { Vector2 } from "../common/Interpolater";

type MouseCursorProps = {
  position: Vector2;
};

function MouseCursor({ position }: MouseCursorProps) {
  return (
    <div
      className="mouse-cursor translate-middle"
      style={{ left: position.x, top: position.y }}
    />
  );
}

export default MouseCursor;
