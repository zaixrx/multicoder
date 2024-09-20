import { Socket } from "socket.io";
import { Appdata, EventHandler } from "./socketTypes";
import { getRoom, getSocket } from "./utils";

export type MouseClick = {
  type: string;
  position: MousePosition;
};

export type MousePosition = {
  x: number;
  y: number;
};

enum messages {
  MOUSE_POSITION = "mousePosition",
  KEYS_PRESSED = "keysPressed",
  MOUSE_CLICKS = "mouseClicks",
}

const communication = (app: Appdata, currentSocket: Socket): EventHandler => ({
  [messages.MOUSE_POSITION]: mousePositionHandler(app, currentSocket),
  [messages.KEYS_PRESSED]: keysPressedHandler(app, currentSocket),
  [messages.MOUSE_CLICKS]: mouseClicksHandler(app, currentSocket),
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
  (roomId: string, keysPressed: { key: string; isShifting: boolean }[]) => {
    const room = getRoom(app, roomId);
    if (!room) return;
    room.members.forEach((member) => {
      if (member.id === currentSocket.id) return;
      const memberSocket = getSocket(app, member.id);
      memberSocket?.emit(messages.KEYS_PRESSED, currentSocket.id, keysPressed);
    });
  };

const mouseClicksHandler =
  (app: Appdata, currentSocket: Socket) =>
  (roomId: string, mouseClicks: MouseClick[]) => {
    const room = getRoom(app, roomId);
    if (!room) return;
    room.members.forEach((member) => {
      if (member.id === currentSocket.id) return;
      const memberSocket = getSocket(app, member.id);
      memberSocket?.emit(messages.MOUSE_CLICKS, currentSocket.id, mouseClicks);
    });
  };

export default communication;
