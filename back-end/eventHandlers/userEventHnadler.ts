import { Socket, AppData } from "./socketTypes";

type Handler = {
  [key: string]: (param: any) => void;
};

type PossibleData = MouseMoveData;

const userEventHandler = (
  app: AppData,
  socket: Socket<MouseMoveData, PossibleData>
): Handler => ({
  mouseMoveEvent: mouseMoveEvent(app, socket),
});

type MouseMoveData = {
  xPosition: number;
  yPosition: number;
};

type MouseMoveEvent = (
  app: AppData,
  socket: Socket<MouseMoveData, {}>
) => (data: MouseMoveData) => void;

const mouseMoveEvent: MouseMoveEvent = (app, socket) => (data) => {
  app.allSockets.forEach((socket) => {
    socket.emit("mouseMoveEvent", data);
  });
  console.log("mouse moved", data);
};

export default userEventHandler;
