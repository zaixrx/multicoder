import { Socket } from "socket.io";
import { Appdata, EventHandler } from "./socketTypes";
import { getRoom, getSocket } from "./utils";

export type MousePosition = {
  x: number;
  y: number;
};

enum messages {
  MOUSE_POSITION = "mousePosition",
  KEYS_PRESSED = "keysPressed",
}

const communication = (app: Appdata, currentSocket: Socket): EventHandler => ({
  [messages.MOUSE_POSITION]: mousePositionHandler(app, currentSocket),
  [messages.KEYS_PRESSED]: keysPressedHandler(app, currentSocket),
});

const mousePositionHandler =
  (app: Appdata, currentSocket: Socket) =>
  (roomId: string, mousePosition: MousePosition) => {
    const room = getRoom(app, roomId);
    if (!room) return;
    room.members.forEach((member) => {
      if (member.id === currentSocket.id) return;
      const memberSocket = getSocket(app, member.id);
      memberSocket?.emit(
        messages.MOUSE_POSITION,
        currentSocket.id,
        mousePosition
      );
    });
  };

const keysPressedHandler =
  (app: Appdata, currentSocket: Socket) =>
  (roomId: string, keysPressed: string[]) => {
    const room = getRoom(app, roomId);
    if (!room) return;
    room.members.forEach((member) => {
      if (member.id === currentSocket.id) return;
      const memberSocket = getSocket(app, member.id);
      memberSocket?.emit(messages.KEYS_PRESSED, currentSocket.id, keysPressed);
    });
  };

export default communication;
