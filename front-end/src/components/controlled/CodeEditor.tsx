import { useContext, useEffect } from "react";
import { UtilityFunctions } from "../../App";
import { FileNode } from "../../assets/directoryTree";
import { Member } from "../../assets/types/roomTypes";
import { Color, CursorPosition, CursorSelection, Vector2 } from "../../assets/types/messageTypes";
import Queue from "../../assets/queue";
import Cursor from "../../common/Cusror";

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
}

function max(x: number, y: number) {
  return x >= y ? x : y;
}

function min(x: number, y: number) {
  return x < y ? x : y;
}

function sumColors(...colors: Color[]): Color {
  let result: Color = { r: 0, g: 0, b: 0 };

  for (let i = 0; i < colors.length; i++) {
    result.r += colors[i].r;
    result.g += colors[i].g;
    result.b += colors[i].b;
  }

  result.r /= colors.length;
  result.g /= colors.length;
  result.b /= colors.length;

  return result;
}

function getColorString({ r, g, b }: Color) {
  return `rgb(${r}, ${g}, ${b})`;
}

function CodeEditor({ selectedFile, currentMember, members }: Props) {
  const Utility = useContext(UtilityFunctions);
  const { content, path } = selectedFile;

  const initializeMember = (member: Member) => {
    member.cursorPosition = { line: 0, column: 0 };
    member.cursorSelection = { start: member.cursorPosition, end: member.cursorPosition };
    member.mousePositionQueue = new Queue<Vector2>();
  };

  function isSelecting({ start, end }: CursorSelection) {
    return start.line === end.line && start.column === end.column;
  }

  useEffect(() => {
    members.forEach(initializeMember);
  }, []);

  const appendText = (text: string, position: CursorPosition, selection: CursorSelection, sendUpdate = true) => {
    const { path, content } = { ...selectedFile }
    const line = content[position.line];
    content[position.line] = line.slice(0, position.column) + text + line.slice(position.column);

    position.column += text.length;
    selection.start = { ...position };
    selection.end = { ...position };

    Utility.setFileContent(path, content, sendUpdate);
  };

  const removeText = (position: CursorPosition, selection: CursorSelection, sendUpdate = true) => {
    if (position.column) {
      const line = content[position.line];

      if (isSelecting(selection)) {
        content[position.line] = line.slice(0, position.column - 1) + line.slice(position.column);
        position.column = max(0, --position.column);
      } else {
        content[selection.start.line] = content[selection.start.line].slice(0, selection.start.column) + content[selection.end.line].slice(selection.end.column);
        content.splice(selection.start.line + 1, selection.end.line);
        position.line = selection.start.line;
        position.column = selection.start.column;
      }
      
      selection.start = { ...position };
      selection.end = { ...position };

      Utility.setFileContent(path, content, sendUpdate);
    } else {
      deleteLine(position.line, position, sendUpdate);
    }
  };

  const addLine = (position: CursorPosition, selection: CursorSelection, sendUpdate = true) => {
    const { content, path } = selectedFile;

    const text = content[position.line].slice(position.column);
    content[position.line] = content[position.line].slice(0, position.column);
    content.splice(++position.line, 0, text);
    
    position.column = 0;
    selection.end = {...position};
    selection.start = {...position};

    Utility.setFileContent(path, content, sendUpdate);
  };

  const deleteLine = (line: number, position: CursorPosition, sendUpdate = true) => {
    if (position.line <= 0) return position.line = 0;

    const { content, path } = selectedFile;
    content.splice(line, 1);

    position.line = max(0, line - 1);
    position.column = content[position.line].length;

    Utility.setFileContent(path, content, sendUpdate);
  };

  const handleTab = (position: CursorPosition, selection: CursorSelection, sendUpdate = true) => {
    appendText("   ", position, selection, sendUpdate);
  };

  const handleBackspace = (position: CursorPosition, selection: CursorSelection, sendUpdate = true) => {
    removeText(position, selection, sendUpdate);
  };

  const handleEnter = (position: CursorPosition, selection: CursorSelection, sendUpdate = true) => {
    addLine(position, selection, sendUpdate);
  };

  const moveCursor = (position: CursorPosition, selection: CursorSelection, desiredPosition: CursorPosition, shift: boolean) => {
    const { content } = selectedFile;

    desiredPosition.line = max(0, min(desiredPosition.line, content.length - 1));

    if (desiredPosition.column < 0) {
      if (desiredPosition.line) {
        desiredPosition.line = max(0, desiredPosition.line - 1);
        desiredPosition.column = content[desiredPosition.line].length;
      } else {
        desiredPosition.column = 0;
      }
    } else if (desiredPosition.column > content[desiredPosition.line].length) {
      if (desiredPosition.line < content.length - 1) {
        desiredPosition.line = min(desiredPosition.line + 1, content.length - 1);
        desiredPosition.column = 0;
      } else {
        desiredPosition.column = content[desiredPosition.line].length;
      }
    }

    position = desiredPosition;
    if (shift) {
      if (position.line < selection.start.line || (position.line === selection.start.line && position.column < selection.start.column)) {
        selection.start = { ...position };
      } else {
        selection.end = { ...position };
      }
    } else {
      selection.end = {...position};
      selection.start = {...position};
    }
  }

  const handleKeyDown = (member: Member, key: string, shift: boolean, sendUpdate = true) => {
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

      case "Tab":
        handleTab(cursorPosition, cursorSelection, sendUpdate);
        break;
      
      default:
        appendText(key, cursorPosition, cursorSelection, sendUpdate);
        break;
    }

    Utility.setMemberCursor(member.id, cursorPosition, cursorSelection, sendUpdate);

    members.forEach(m => {
      if (m.id === member.id) return;
      let update = false;

      if (m.cursorPosition.line >= content.length) {
        m.cursorPosition.line = content.length - 1;
        update = true;
      }
     
      if (m.cursorPosition.column >= content[m.cursorPosition.line].length) {
        m.cursorPosition.column = content[m.cursorPosition.line].length;
        update = true;
      }

      if (update)
        Utility.setMemberCursor(m.id, m.cursorPosition, m.cursorSelection, sendUpdate);
    });
  }

  const renderLine = (line: number): React.ReactNode => {
    const lineMembers: { [member: string]: {start?: number, end?: number} } = {};
    const breakpoints = new Set<number>([0, content[line].length]);

    members.forEach((member) => {
      const { cursorSelection: selection, id } = member;
      if (selection.start === selection.end) return;

      lineMembers[id] = { };
      
      if (selection.start.line < line && line < selection.end.line) {
        lineMembers[id] = {
          start: 0,
          end: content[line].length
        };

        return;
      }

      if (selection.start.line === line) {
        breakpoints.add(selection.start.column);
        lineMembers[id].start = selection.start.column;
      }

      if (selection.end.line === line) {
        breakpoints.add(selection.end.column);
        lineMembers[id].end = selection.end.column;
      }
    });

    const sortedPoints = [...breakpoints].sort((a, b) => a - b);

    const chunks: { text: string, start: number, end: number, members: Member[] }[] = [];
    for (let i = 0; i < sortedPoints.length - 1; i++) {
      const chunkStart = sortedPoints[i];
      const chunkEnd = sortedPoints[i + 1];

      const chunkMembers = members.filter(({ cursorSelection: selection }) => {
        const { start, end } = selection;

        const a = start.line === line;
        const aBb = start.line < line && line < end.line;
        const b = end.line === line;
        const c = start.column <= chunkStart;
        const d = end.column >= chunkEnd;

        return aBb || (a && b && c && d) || (a && !b && c) || (!a && b && d);
      });
      const chunkText = content[line].slice(chunkStart, chunkEnd);

      chunks.push({
        text: chunkText,
        end: chunkEnd,
        start: chunkStart,
        members: chunkMembers
      });
    }

    function getStyles(members: Member[])  {
      if (!members.length) return { background: "transparent" };

      const color = sumColors(...members.map((m) => m.color));

      return {
        background: getColorString(color)
      };
    }

    return (
      <pre key={line} className="line">
        {
          (() => {
            return chunks.map(({ members, text }, i) => (
              <span key={i} style={getStyles(members)}>{text}</span>
            ));
          })()
        }
      </pre>
    );
  };

  return (
    <>
      <button onClick={Utility.interpretCode}><img src="run.svg" alt="Run"/></button>
      <section
        className="code-area w-100"
        tabIndex={0}
        onKeyDown={(e) => {
          e.preventDefault();
          handleKeyDown(currentMember, e.key, e.shiftKey);
        }}
      >
        {members.map(({ id, color, cursorPosition }) => (
          <Cursor key={id} color={color} position={cursorPosition}/>
        ))}
        {content.map((_, index) => renderLine(index))}
      </section>
    </>
  )
}

export default CodeEditor;
