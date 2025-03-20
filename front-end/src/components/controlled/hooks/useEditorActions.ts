import { clamp, max } from "lodash";
import {
  CursorPosition,
  CursorSelection,
  Vector2,
} from "../../../assets/types/messageTypes";
import { Member } from "../../../assets/types/roomTypes";
import { getOrderedSelection } from "../../../assets/utils";
import { UFT } from "../../../App";
import { Line } from "@/assets/directoryTree";

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

export function useEditorActions(Utility: UFT, path: string[], lines: Line[]) {
  function getMaxCol(lineIndex: number) {
    return lines[lineIndex].content.length;
  }

  const appendText = (
    text: string,
    { cursorSelection: selection, cursorPosition: position }: State
  ) => {
    lines[position.line].content =
      lines[position.line].content.slice(0, position.column) +
      text +
      lines[position.line].content.slice(position.column);

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
      if (position.column === 0 && position.line >= 1) {
        const content = lines[position.line].content;
        deleteLine(position.line, position);
        lines[position.line].content += content;
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
    const text = lines[position.line].content.slice(position.column);
    lines[position.line].content = lines[position.line].content.slice(
      0,
      position.column
    );
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
      const { tokens } = lines[line];

      for (let i = 0; i < tokens.length; i++) {
        if (
          0 <= column - tokens[i].offset &&
          column - tokens[i].offset <= tokens[i].content.length
        ) {
          if (direction.x > 0) {
            column = tokens[i].offset + tokens[i].content.length;
          } else if (direction.x < 0) {
            column = tokens[i].offset;
          }

          break;
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

    const { cursorSelection: selection, cursorPosition: position } = member;
    const state: State = {
      cursorSelection: selection,
      cursorPosition: position,
      control,
      shift,
    };

    let direction: Vector2 = { x: 0, y: 0 };

    switch (key) {
      case "Backspace":
        removeText(state);
        break;

      case "Enter":
        addLine(state);
        break;

      case "ArrowLeft":
        position.column--;
        direction.x--;
        fixPosition(state, direction);
        break;

      case "ArrowRight":
        position.column++;
        direction.x++;
        fixPosition(state, direction);
        break;

      case "ArrowDown":
        position.line++;
        direction.y++;
        fixPosition(state, direction);
        break;

      case "ArrowUp":
        position.line--;
        direction.y--;
        fixPosition(state, direction);
        break;

      case "End":
        position.column = getMaxCol(position.line);
        direction.x++;
        fixPosition(state, direction);
        break;

      case "Home":
        position.column = 0;
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

    Utility.setFileContent(
      member.id,
      path,
      lines.map((l) => l.content),
      position,
      selection,
      true
    );

    /* do this server side
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
    */
  };

  return { handleKeyDown };
}
