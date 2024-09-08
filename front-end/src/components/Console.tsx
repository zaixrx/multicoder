import { useEffect, useState } from "react";

export interface Command {
  text: string;
}

interface ConsoleProps {
  onGetAddCommandTriggerd: Function;
}

function Console({
  onGetAddCommandTriggerd: getAddCommandFunctionRefrence,
}: ConsoleProps) {
  const [commands, setCommands] = useState<Command[]>([]);

  useEffect(() => {
    getAddCommandFunctionRefrence(addCommand);
  }, []);

  function addCommand(command: Command) {
    if (command) setCommands([...commands, command]);
  }

  return (
    <div className="console">
      {commands.map((command, index) => (
        <div key={index}>$ {command.text}</div>
      ))}
    </div>
  );
}

export default Console;
