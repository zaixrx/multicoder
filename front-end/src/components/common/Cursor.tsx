import {
  Color,
  Vector2,
  CursorPosition,
} from "../../assets/types/messageTypes";

export type CursorType = {
  color: Color;
  dimensions: Vector2;
  position: CursorPosition;
};

function Cursor({ position, color, dimensions }: CursorType) {
  return (
    <span
      className="cursor-bar"
      style={{
        left: dimensions.x * position.column,
        top: dimensions.y * position.line,
        borderColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
      }}
    />
  );
}

export default Cursor;
