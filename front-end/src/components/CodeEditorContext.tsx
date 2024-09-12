/*import { createContext, useState } from "react";

const CodeEditorContext = createContext<any>(undefined);

export function CodeEditorContextProvider({ children }: any) {
  const [lines, setLines] = useState<Line[]>([{ code: "" }]);
  const [selectedLine, setSelectedLine] = useState<number>(1);
  const [cursorPosition, setCursorPosition] = useState<CursorPosition>({
    line: 1,
    column: 0,
  });

  return (
    <CodeEditorContext.Provider
      value={{
        lines,
        setLines,
        selectedLine,
        setSelectedLine,
        cursorPosition,
        setCursorPosition,
      }}
    >
      {children}
    </CodeEditorContext.Provider>
  );
}

export default CodeEditorContext;

export type Line = {
  code: string;
};

export type CursorPosition = {
  line: number;
  column: number;
};
*/
