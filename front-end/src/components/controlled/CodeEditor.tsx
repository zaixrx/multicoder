import { Fragment, useContext, useEffect } from "react";
import { UtilityFunctions } from "../../App";
import { Line } from "../../assets/directoryTree";
import { Member } from "../../assets/types/roomTypes";
import Cursor from "../common/Cursor";
import { getCharacterDimensions } from "../../assets/utils";
import { useEditorActions } from "./hooks/useEditorActions";
import { useEditorRendering } from "./hooks/useEditorRendering";

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

function CodeEditor({ lines, path, currentMember, members }: Props) {
  const Utility = useContext(UtilityFunctions);
  const dimensions = getCharacterDimensions();

  const initializeMember = (member: Member) => {
    member.cursorPosition = { line: 0, column: 0 };
    member.cursorSelection = {
      start: member.cursorPosition,
      end: member.cursorPosition,
    };
  };

  useEffect(() => {
    members.forEach(initializeMember);
  }, []);

  const { handleKeyDown } = useEditorActions(Utility, members, path, lines);
  const { renderSelection } = useEditorRendering(members, lines, dimensions);

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
        {lines.map((line, lineIndex) => (
          <Fragment key={lineIndex}>
            {renderSelection(lineIndex)}
            <pre className="line">
              {line.tokens.map((token) => {
                return (
                  <span style={{ color: token.color }}>{token.content}</span>
                );
              })}
            </pre>
          </Fragment>
        ))}
      </section>
    </>
  );
}

export default CodeEditor;
