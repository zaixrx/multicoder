import { useState, useEffect } from "react";
import CodeArea, { Line } from "./components/CodeArea";
import Console, { Command } from "./components/Console";
import "./design.css";

import { io, Socket } from "socket.io-client";

type MousePosition = {
  x: number;
  y: number;
};

let socket: Socket;

export default function App() {
  const [mousePositon, setMousePosition] = useState<MousePosition>({
    x: 0,
    y: 0,
  });
  const [loadedSocket, setLoadedSocket] = useState<Boolean>(false);

  useEffect(() => {
    if (loadedSocket) return;

    try {
      socket = io("ws://127.0.0.1:3000");

      socket.on("helloMessage", () => {
        socket.emit("helloMessageReceived", "ana anis");
        setLoadedSocket(true);
      });

      socket.on("mouseMoveEvent", (data) => {
        console.log("Mouse Moved:", data);
      });

      setInterval(() => {
        socket.emit("mouseMoveEvent", {
          xPosition: mousePositon.x,
          yPosition: mousePositon.y,
        });
      }, 1000);
    } catch {
      console.log("Could not connect");
    }
  }, []);

  function handleCodeCompilation(lines: Line[]) {
    let code = "";
    lines.map((line) => line.code && (code += `${line.code}\n`));
    try {
      eval(code);
      addCommand({ text: "Compiled With Success!" });
    } catch (error: unknown) {
      if (error instanceof Error) {
        addCommand({ text: error.toString() });
      }
    }
  }

  const [addCommand, setAddCommand] = useState<Function>(() => () => {});
  function handleGetAddCommandTriggerd(addCommandFunction: Function) {
    setAddCommand(() => (command: Command) => addCommandFunction(command));
  }

  return (
    <div
      tabIndex={0}
      onMouseMove={(e) => setMousePosition({ x: e.clientX, y: e.clientY })}
    >
      <Console onGetAddCommandTriggerd={handleGetAddCommandTriggerd} />
      <CodeArea onCompile={(lines: Line[]) => handleCodeCompilation(lines)} />
    </div>
  );
}
