import { Fragment, useContext, useEffect } from "react";
import { UtilityFunctions } from "../../App";
import { Line } from "../../assets/directoryTree";
import { Member } from "../../assets/types/roomTypes";
import Cursor from "../common/Cursor";
import { getCharacterDimensions } from "../../assets/utils";
import { useEditorActions } from "./hooks/useEditorActions";
import { useEditorRendering } from "./hooks/useEditorRendering";
import { Button } from "../ui/button";

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

const initializeMember = (member: Member) => {
  member.cursorPosition = { line: 0, column: 0 };
  member.cursorSelection = {
    start: member.cursorPosition,
    end: member.cursorPosition,
  };
};

function CodeEditor({ lines, path, currentMember, members }: Props) {
  const Utility = useContext(UtilityFunctions);
  const dimensions = getCharacterDimensions();

  useEffect(() => {
    members.forEach(initializeMember);
  }, []);

  const linesContent = lines.map((l) => l.content);

  const { handleKeyDown } = useEditorActions(Utility, path, linesContent);
  const { renderSelection } = useEditorRendering(
    members,
    linesContent,
    dimensions
  );

  return (
    <div className="py-2">
      <Button onClick={Utility.interpretCode}>
        <img src="run.svg" alt="Run" />
      </Button>
      <div className="flex my-2">
        <div className="w-[50px] bg-[#111]">
          {lines.map((_, i) => (
            <center
              className={
                i === currentMember.cursorPosition.line
                  ? `text-gray-200`
                  : `text-gray-400`
              }
            >
              {i + 1}
            </center>
          ))}
        </div>
        <section
          className="relative cursor-text w-100"
          tabIndex={0}
          onKeyDown={async (e) => {
            e.preventDefault();
            await handleKeyDown(currentMember, e.key, e.shiftKey, e.ctrlKey);
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
      </div>
    </div>
  );
}

export default CodeEditor;
