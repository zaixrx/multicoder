import {
  Color,
  CursorSelection,
  Vector2,
} from "../../assets/types/messageTypes";
import { getColorString } from "../../assets/utils";

type Props = {
  color: Color;
  selection: CursorSelection;
  dimensions: Vector2;
};

function Selection({ selection, color, dimensions }: Props) {
  const left = dimensions.x * selection.start.column;
  const top = dimensions.y * selection.start.line;
  const width = (selection.end.column - selection.start.column) * dimensions.x;
  const height = dimensions.y;

  return (
    <div
      style={{
        position: "absolute",
        backgroundColor: getColorString(color),
        left,
        top,
        width,
        height,
        opacity: 0.3,
      }}
    />
  );
}

export default Selection;
