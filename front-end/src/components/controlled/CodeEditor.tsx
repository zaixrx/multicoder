import { useContext, useEffect } from "react";
import { UtilityFunctions } from "../../App";
import { FileNode } from "../../assets/directoryTree";
import { Member } from "../../assets/types/roomTypes";
import {
  Color,
  CursorPosition,
  CursorSelection,
  Vector2,
} from "../../assets/types/messageTypes";
import Queue from "../../assets/queue";
import Cursor from "../common/Cursor";
import Selection from "../common/Selection";
import { max, min } from "../../assets/utils";

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

type Props = {
  selectedFile: FileNode;
  currentMember: Member;
  members: Member[];
};

export type Chunk = {
  text: string;
  start: number;
  end: number;
  members: Member[];
};

function CodeEditor({ selectedFile, currentMember, members }: Props) {
  const Utility = useContext(UtilityFunctions);
  const { content, path } = selectedFile;

  const getCharacterDimensions = (): Vector2 => {
    // Yes this is AI generated, and I'm not gonna hide that
    const pre = document.createElement("pre");
    pre.style.position = "absolute";
    pre.style.visibility = "hidden";
    pre.style.fontFamily = "monospace"; // Match the font you're using
    pre.style.fontSize = "16px"; // Match the font size you're using
    pre.textContent = "M"; // Use any character; "M" is often a good choice for width
    pre.classList.add("line");
    document.body.appendChild(pre);
    const rect = pre.getBoundingClientRect();
    document.body.removeChild(pre);
    return { x: rect.width, y: rect.height };
  };

  const dimensions = getCharacterDimensions();

  const initializeMember = (member: Member) => {
    member.cursorPosition = { line: 0, column: 0 };
    member.cursorSelection = {
      start: member.cursorPosition,
      end: member.cursorPosition,
    };
    member.mousePositionQueue = new Queue<Vector2>();
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

  useEffect(() => {
    members.forEach(initializeMember);
  }, []);

  const appendText = (
    text: string,
    position: CursorPosition,
    selection: CursorSelection,
    sendUpdate = true
  ) => {
    const { path, content } = { ...selectedFile };
    const line = content[position.line];
    content[position.line] =
      line.slice(0, position.column) + text + line.slice(position.column);

    position.column += text.length;
    selection.start = { ...position };
    selection.end = { ...position };

    Utility.setFileContent(path, content, sendUpdate);
  };

  const removeText = (
    position: CursorPosition,
    cursorSelection: CursorSelection,
    sendUpdate = true
  ) => {
    const selection = getOrderedSelection(cursorSelection);

    if (isSelecting(selection)) {
      content[selection.start.line] =
        content[selection.start.line].slice(0, selection.start.column) +
        content[selection.end.line].slice(selection.end.column);
      content.splice(selection.start.line + 1, selection.end.line);
      position.line = selection.start.line;
      position.column = selection.start.column;
    } else {
      if (position.column) {
        const line = content[position.line];
        content[position.line] =
          line.slice(0, position.column - 1) + line.slice(position.column);
        position.column = max(0, --position.column);
      } else {
        deleteLine(position.line, position, sendUpdate);
      }
    }

    cursorSelection.start = { ...position };
    cursorSelection.end = { ...position };

    Utility.setFileContent(path, content, sendUpdate);
  };

  const addLine = (
    position: CursorPosition,
    selection: CursorSelection,
    sendUpdate = true
  ) => {
    const { content, path } = selectedFile;

    const text = content[position.line].slice(position.column);
    content[position.line] = content[position.line].slice(0, position.column);
    content.splice(++position.line, 0, text);

    position.column = 0;
    selection.end = { ...position };
    selection.start = { ...position };

    Utility.setFileContent(path, content, sendUpdate);
  };

  const deleteLine = (
    line: number,
    position: CursorPosition,
    sendUpdate = true
  ) => {
    if (position.line <= 0) return (position.line = 0);

    const { content, path } = selectedFile;
    content.splice(line, 1);

    position.line = max(0, line - 1);
    position.column = content[position.line].length;

    Utility.setFileContent(path, content, sendUpdate);
  };

  const handleTab = (
    position: CursorPosition,
    selection: CursorSelection,
    sendUpdate = true
  ) => {
    appendText("   ", position, selection, sendUpdate);
  };

  const handleBackspace = (
    position: CursorPosition,
    selection: CursorSelection,
    sendUpdate = true
  ) => {
    removeText(position, selection, sendUpdate);
  };

  const handleEnter = (
    position: CursorPosition,
    selection: CursorSelection,
    sendUpdate = true
  ) => {
    addLine(position, selection, sendUpdate);
  };

  const moveCursor = (
    position: CursorPosition,
    selection: CursorSelection,
    desiredPosition: CursorPosition,
    shift: boolean
  ) => {
    const { content } = selectedFile;

    desiredPosition.line = max(
      0,
      min(desiredPosition.line, content.length - 1)
    );

    // TODO: Fix this mess
    if (desiredPosition.column < 0) {
      if (desiredPosition.line) {
        desiredPosition.line = max(0, desiredPosition.line - 1);
        desiredPosition.column = content[desiredPosition.line].length;
      } else {
        desiredPosition.column = 0;
      }
    } else if (desiredPosition.column > content[desiredPosition.line].length) {
      if (desiredPosition.line < content.length - 1) {
        desiredPosition.line = min(
          desiredPosition.line + 1,
          content.length - 1
        );
        desiredPosition.column = 0;
      } else {
        desiredPosition.column = content[desiredPosition.line].length;
      }
    }

    position = desiredPosition;

    if (shift) {
      selection.end = { ...position };
    } else {
      selection.end = { ...position };
      selection.start = { ...position };
    }
  };

  const handleKeyDown = (
    member: Member,
    key: string,
    shift: boolean,
    sendUpdate = true
  ) => {
    if (keysToIgnore.includes(key)) return;

    const { cursorPosition, cursorSelection } = member;
    let desiredPosition = cursorPosition;

    switch (key) {
      case "Backspace":
        handleBackspace(cursorPosition, cursorSelection, sendUpdate);
        break;

      case "Enter":
        handleEnter(cursorPosition, cursorSelection, sendUpdate);
        break;

      case "ArrowLeft":
        desiredPosition.column--;
        moveCursor(cursorPosition, cursorSelection, desiredPosition, shift);
        break;

      case "ArrowRight":
        desiredPosition.column++;
        moveCursor(cursorPosition, cursorSelection, desiredPosition, shift);
        break;

      case "ArrowDown":
        desiredPosition.line++;
        moveCursor(cursorPosition, cursorSelection, desiredPosition, shift);
        break;

      case "ArrowUp":
        desiredPosition.line--;
        moveCursor(cursorPosition, cursorSelection, desiredPosition, shift);
        break;

      case "End":
        desiredPosition.column = content[cursorPosition.line].length;
        moveCursor(cursorPosition, cursorSelection, desiredPosition, shift);
        break;

      case "Home":
        desiredPosition.column = 0;
        moveCursor(cursorPosition, cursorSelection, desiredPosition, shift);
        break;

      case "Tab":
        handleTab(cursorPosition, cursorSelection, sendUpdate);
        break;

      default:
        appendText(key, cursorPosition, cursorSelection, sendUpdate);
        break;
    }

    Utility.setMemberCursor(
      member.id,
      cursorPosition,
      cursorSelection,
      sendUpdate
    );

    members.forEach((m) => {
      if (m.id === member.id) return;
      let update = false;

      // TODO: Rework the system
      if (m.cursorPosition.line >= content.length) {
        m.cursorPosition.line = content.length - 1;
        update = true;
      }

      if (m.cursorPosition.column >= content[m.cursorPosition.line].length) {
        m.cursorPosition.column = content[m.cursorPosition.line].length;
        update = true;
      }

      if (update)
        Utility.setMemberCursor(
          m.id,
          m.cursorPosition,
          m.cursorSelection,
          sendUpdate
        );
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
      if (start.line === end.line && start.column === end.column) return;

      const index = selections.length;

      selections.push({
        selection: {
          start: { line, column: 0 },
          end: { line, column: 0 },
        },
        color: member.color,
      });

      if (start.line < line && line < end.line) {
        selections[index].selection.end.column = content[line].length;
      }

      if (start.line === line) {
        selections[index].selection.start.column = start.column;
        selections[index].selection.end.column = content[line].length;
      }

      if (end.line === line) {
        selections[index].selection.end.column = end.column;
      }
    });

    return selections.map(({ selection, color }) => (
      <Selection selection={selection} color={color} dimensions={dimensions} />
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
          handleKeyDown(currentMember, e.key, e.shiftKey);
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
        {content.map((line, index) => (
          <>
            {renderSelection(index)}
            <pre key={index} className="line">
              {line}
            </pre>
          </>
        ))}
      </section>
    </>
  );
}

export default CodeEditor;
