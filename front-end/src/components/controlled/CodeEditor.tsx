import { Fragment, useContext, useEffect } from "react";
import { UtilityFunctions } from "../../App";
import { Line } from "../../assets/directoryTree";
import { Member } from "../../assets/types/roomTypes";
import {
  Color,
  CursorPosition,
  CursorSelection,
  Vector2,
} from "../../assets/types/messageTypes";
import Cursor from "../common/Cursor";
import Selection from "../common/Selection";
import { clamp, getCharacterDimensions, max } from "../../assets/utils";
import { Token } from "acorn";

const keysToIgnore: string[] = [
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

const tokenColors: { [type: string]: string } = {
  keyword: "#1D618B",

  name: "#2EC18B",
  num: "#2AAD95",
  string: "#25A75E",
};

interface Props {
  currentMember: Member;
  members: Member[];
  lines: Line[];
  path: string[];
}

export interface Chunk {
  text: string;
  start: number;
  end: number;
  members: Member[];
}

interface State {
  cursorPosition: CursorPosition;
  cursorSelection: CursorSelection;
  control: boolean;
  shift: boolean;
}

function CodeEditor({ lines, path, currentMember, members }: Props) {
  const Utility = useContext(UtilityFunctions);
  const dimensions = getCharacterDimensions();

  function getMaxCol(lineIndex: number) {
    return lines[lineIndex].content.length;
  }

  const initializeMember = (member: Member) => {
    member.cursorPosition = { line: 0, column: 0 };
    member.cursorSelection = {
      start: member.cursorPosition,
      end: member.cursorPosition,
    };
  };

  function isSelecting({ start, end }: CursorSelection): boolean {
    return start.line !== end.line || start.column !== end.column;
  }

  function getOrderedSelection(selection: CursorSelection): CursorSelection {
    const result: CursorSelection = { ...selection };

    if (
      result.end.line < result.start.line ||
      (result.end.line === result.start.line &&
        result.end.column < result.start.column)
    ) {
      const temp = { ...result.start };
      result.start = { ...result.end };
      result.end = { ...temp };
    }

    return result;
  }

  function EqualPositions(a: CursorPosition, b: CursorPosition): boolean {
    return a.line === b.line && a.column === b.column;
  }

  useEffect(() => {
    members.forEach(initializeMember);
  }, []);

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

        position.column = max(0, --position.column);
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

    position.line = max(0, lineIndex - 1);
    position.column = getMaxCol(position.line);
  };

  const handleTab = (state: State) => {
    appendText("   ", state);
  };

  const handleBackspace = (state: State) => {
    removeText(state);
  };

  const handleEnter = (state: State) => {
    addLine(state);
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

  const handleKeyDown = (
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
        handleBackspace(state);
        break;

      case "Enter":
        handleEnter(state);
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
        handleTab(state);
        break;

      default:
        appendText(key, state);
        break;
    }

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

  const renderSelection = (line: number): React.ReactNode => {
    interface Selection {
      color: Color;
      selection: CursorSelection;
    }

    const selections: Selection[] = [];

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
        selection.end.column = getMaxCol(line);
        return;
      }

      if (start.line === line) {
        selection.start.column = start.column;
        selection.end.column = getMaxCol(line);
      }

      if (end.line === line) {
        selection.end.column = end.column;
      }
    });

    return selections.map(({ selection, color }, index) => (
      <Selection
        key={index}
        selection={selection}
        color={color}
        dimensions={dimensions}
      />
    ));
  };

  const renderCode = (lineIndex: number): React.ReactNode => {
    const { content, tokens } = lines[lineIndex];

    const endPointsSet = new Set<number>([0, content.length]);
    tokens.forEach((token) => {
      endPointsSet.add(token.start);
      endPointsSet.add(token.end);
    });

    const endPoints = [...endPointsSet].sort((a: number, b: number) => a - b);

    const chunks: { start: number; end: number; token: Token | undefined }[] =
      [];

    let tokenIndex = 0;
    for (let i = 0; i < endPoints.length; i++) {
      let token: Token | undefined;
      const start = endPoints[i];
      const end = endPoints[i + 1];

      if (tokens.length) {
        if (tokens[tokenIndex].end < start) tokenIndex++;
        if (
          tokens[tokenIndex] &&
          tokens[tokenIndex].start <= start &&
          end <= tokens[tokenIndex].end
        ) {
          token = tokens[tokenIndex];
        }
      }

      chunks[i] = {
        start,
        end,
        token,
      };
    }

    function getColor(token: Token) {
      if (token.type.keyword) {
        return tokenColors.keyword;
      } else {
        return tokenColors[token.type.label];
      }
    }

    return chunks.map(({ start, end, token }, index) => (
      <span key={index} style={{ color: token ? getColor(token) : "black" }}>
        {content.slice(start, end)}
      </span>
    ));
  };

  return (
    <>
      <button onClick={Utility.interpretCode}>
        <img src="run.svg" alt="Run" />
      </button>
      <section
        className="code-area w-100"
        tabIndex={0}
        onKeyDown={(e) => {
          e.preventDefault();
          handleKeyDown(currentMember, e.key, e.shiftKey, e.ctrlKey);
        }}
      >
        {members.map(({ id, color, cursorPosition }) => (
          <Cursor
            key={id}
            color={color}
            dimensions={dimensions}
            position={cursorPosition}
          />
        ))}
        {lines.map((_, lineIndex) => (
          <Fragment key={lineIndex}>
            {renderSelection(lineIndex)}
            <pre className="line">{renderCode(lineIndex)}</pre>
          </Fragment>
        ))}
      </section>
    </>
  );
}

export default CodeEditor;
