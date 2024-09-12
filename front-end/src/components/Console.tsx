import { useEffect, useState } from "react";

interface ConsoleProps {
  getConsolePrintLine: Function;
}

function Console({ getConsolePrintLine }: ConsoleProps) {
  const [consoleLines, setConsoleLines] = useState<string[]>([]);

  useEffect(() => {
    getConsolePrintLine(printConsoleLine);
  }, []);

  function printConsoleLine(consoleLine: string) {
    if (!consoleLine) return;
    setConsoleLines([...consoleLines, consoleLine]);
  }

  return (
    <div className="console">
      {consoleLines.map((consoleLine, index) => (
        <div key={index}>$ {consoleLine}</div>
      ))}
    </div>
  );
}

export default Console;
