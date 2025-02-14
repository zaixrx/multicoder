import { clamp, max } from "lodash";
import { Line } from "../../../assets/directoryTree";
import {
  CursorPosition,
  CursorSelection,
  Vector2,
} from "../../../assets/types/messageTypes";
import { Member } from "../../../assets/types/roomTypes";
import {
  EqualPositions,
  getOrderedSelection,
  getTokens,
} from "../../../assets/utils";
import { UFT } from "../../../App";

function isSelecting({ start, end }: CursorSelection): boolean {
  return start.line !== end.line || start.column !== end.column;
}

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

interface State {
  cursorPosition: CursorPosition;
  cursorSelection: CursorSelection;
  control: boolean;
  shift: boolean;
}

export function useEditorActions(
  Utility: UFT,
  members: Member[],
  path: string[],
  lines: Line[]
) {
  function getMaxCol(lineIndex: number) {
    return lines[lineIndex].content.length;
  }

  const appendText = (
    text: string,
    { cursorSelection: selection, cursorPosition: position }: State
  ) => {
    const line = lines[position.line];

    line.content =
      line.content.slice(0, position.column) +
      text +
      line.content.slice(position.column);

    position.column += text.length;
    selection.start = { ...position };
    selection.end = { ...position };
  };

  const removeText = ({
    cursorSelection: selection,
    cursorPosition: position,
  }: State) => {
    if (isSelecting(selection)) {
      const { start, end } = getOrderedSelection(selection);

      lines[start.line].content =
        lines[start.line].content.slice(0, start.column) +
        lines[end.line].content.slice(end.column);

      if (start.line !== end.line) lines.splice(start.line + 1, end.line);

      position.line = start.line;
      position.column = start.column;
    } else {
      if (position.column === 0) {
        deleteLine(position.line, position);
      } else {
        lines[position.line].content =
          lines[position.line].content.slice(0, position.column - 1) +
          lines[position.line].content.slice(position.column);

        position.column = max([0, --position.column]) || 0;
      }
    }

    selection.start = { ...position };
    selection.end = { ...position };
  };

  const addLine = ({
    cursorPosition: position,
    cursorSelection: selection,
  }: State) => {
    const line = lines[position.line];

    const text = line.content.slice(position.column);
    line.content = line.content.slice(0, position.column);
    lines.splice(++position.line, 0, { content: text, tokens: [] });

    position.column = 0;
    selection.end = { ...position };
    selection.start = { ...position };
  };

  const deleteLine = (lineIndex: number, position: CursorPosition): void => {
    if (position.line <= 0) {
      position.line = 0;
      return;
    }

    lines.splice(lineIndex, 1);

    position.line = max([0, lineIndex - 1]) || 0;
    position.column = getMaxCol(position.line);
  };

  const fixPosition = (
    {
      cursorSelection: selection,
      cursorPosition: position,
      shift,
      control,
    }: State,
    direction: Vector2
  ) => {
    let { line, column } = position;

    if (control) {
      const { content } = lines[line];

      if (direction.x > 0) {
        while (content[column] === " " && column < content.length) {
          column++;
        }

        while (content[column] !== " " && column < content.length) {
          ++column;
        }
      } else if (direction.x < 0) {
        while (content[column] === " " && column > 0) {
          --column;
        }

        while (content[column] !== " " && column > 0) {
          if (column - 1 > 0 && content[column - 1] === " ") break;

          --column;
        }
      }
    }

    if (direction.y) {
      line = clamp(line, 0, lines.length - 1);
      column = clamp(column, 0, getMaxCol(line));
    } else {
      if (column < 0) {
        column = line ? getMaxCol(--line) : 0;
      } else if (column > getMaxCol(line)) {
        column = line === lines.length - 1 ? getMaxCol(line) : ++line && 0;
      }
    }

    position.line = line;
    position.column = column;

    if (shift === false) selection.start = { line, column };
    selection.end = { line, column };
  };

  const handleKeyDown = async (
    member: Member,
    key: string,
    shift: boolean,
    control: boolean
  ) => {
    if (keysToIgnore.includes(key)) return;

    const state: State = {
      cursorSelection: member.cursorSelection,
      cursorPosition: member.cursorPosition,
      control,
      shift,
    };

    const { cursorSelection, cursorPosition } = state;
    let direction: Vector2 = { x: 0, y: 0 };

    switch (key) {
      case "Backspace":
        removeText(state);
        break;

      case "Enter":
        addLine(state);
        break;

      case "ArrowLeft":
        cursorPosition.column--;
        direction.x--;
        fixPosition(state, direction);
        break;

      case "ArrowRight":
        cursorPosition.column++;
        direction.x++;
        fixPosition(state, direction);
        break;

      case "ArrowDown":
        cursorPosition.line++;
        direction.y++;
        fixPosition(state, direction);
        break;

      case "ArrowUp":
        cursorPosition.line--;
        direction.y--;
        fixPosition(state, direction);
        break;

      case "End":
        cursorPosition.column = getMaxCol(cursorPosition.line);
        direction.x++;
        fixPosition(state, direction);
        break;

      case "Home":
        cursorPosition.column = 0;
        direction.x--;
        fixPosition(state, direction);
        break;

      case "Tab":
        appendText("   ", state);
        break;

      default:
        appendText(key, state);
        break;
    }

    lines[cursorPosition.line].tokens = await getTokens(
      lines[cursorPosition.line].content
    );

    Utility.setFileContent(
      path,
      lines.map((l) => l.content)
    );
    Utility.setMemberCursor(member.id, cursorPosition, cursorSelection);

    members.map((m) => {
      if (member.id === m.id) return;

      const { cursorPosition, cursorSelection } = m;

      const getActualPosition = (position: CursorPosition) => {
        return {
          line: clamp(position.line, 0, lines.length - 1),
          column: clamp(position.column, 0, getMaxCol(position.line)),
        };
      };

      let position = getActualPosition(cursorPosition);
      let selection = {
        start: getActualPosition(cursorSelection.start),
        end: getActualPosition(cursorSelection.end),
      };

      if (
        !EqualPositions(cursorPosition, position) ||
        !EqualPositions(cursorSelection.start, selection.start) ||
        !EqualPositions(cursorSelection.end, selection.end)
      )
        Utility.setMemberCursor(m.id, position, selection);
    });
  };

  return { handleKeyDown };
}
