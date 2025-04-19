import { Member } from "../../../assets/types/roomTypes";
import {
  Color,
  CursorSelection,
  Vector2,
} from "../../../assets/types/messageTypes";
import { EqualPositions, getOrderedSelection } from "../../../assets/utils";
import Selection from "../../common/Selection";
import { Line } from "../../../assets/directoryTree";

export function useEditorRendering(
  members: Member[],
  lines: Line[],
  characterDimensions: Vector2
) {
  function renderSelection(line: number) {
    const selections: {
      color: Color;
      selection: CursorSelection;
    }[] = [];

    members.forEach((member) => {
      const { start, end } = getOrderedSelection(member.cursorSelection);
      if (EqualPositions(start, end)) return;

      const index = selections.length;
      selections.push({
        selection: {
          start: { line, column: 0 },
          end: { line, column: 0 },
        },
        color: member.color,
      });

      const selection = selections[index].selection;

      if (start.line < line && line < end.line) {
        selection.end.column = lines[line].content.length;
        return;
      }

      if (start.line === line) {
        selection.start.column = start.column;
        selection.end.column = lines[line].content.length;
      }

      if (end.line === line) {
        selection.end.column = end.column;
      }
    });

    return selections.map(({ selection, color }, index) => (
      <Selection
        key={index}
        color={color}
        selection={selection}
        dimensions={characterDimensions}
      />
    ));
  }

  return { renderSelection };
}
