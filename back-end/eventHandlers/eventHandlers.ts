import { Socket } from "./socketTypes";

const connectedSockets: Socket<any, any>[] = [];

const eventHandlers = (server: any) => {
  const io = require("socket.io")(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket: Socket<any, any>) => {
    const index = connectedSockets.length;

    socket.emit("helloMessage", {});
    socket.on("helloMessageReceived", (data) => {
      console.log("Connected Client", data);
      connectedSockets.push(socket);
    });

    socket.on("mouseMoveEvent", (mouseData) => {
      connectedSockets.forEach((connectedSocket) => {
        if (connectedSocket === socket) return;
        connectedSocket.emit("connectedSocket", mouseData);
      });
    });

    socket.on("disconnect", () => {
      connectedSockets.splice(index, 1);
    });
  });
};

export default eventHandlers;
