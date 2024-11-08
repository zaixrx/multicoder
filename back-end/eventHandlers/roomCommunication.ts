import { Socket } from "socket.io";
import { Appdata, EventHandler } from "./socketTypes";
import { getRoom, getSocket } from "./utils";
import DirectoryTree from "./utils/directoryTree";

export type MouseClick = {
  type: string;
  position: MousePosition;
};

export type MousePosition = {
  x: number;
  y: number;
};

enum Messages {
  MOUSE_POSITION = "mousePosition",
  KEYS_PRESSED = "keysPressed",
  FILE_CREATED = "fileCreated",
  FILE_SELECTED = "folderCreated",
  FOLDER_CREATED = "folderCreated",
  DIRECTORY_SELECTED = "directorySelected",
}

const communication = (app: Appdata, currentSocket: Socket): EventHandler => ({
  [Messages.MOUSE_POSITION]: mousePositionHandler(app, currentSocket),
  [Messages.KEYS_PRESSED]: keysPressedHandler(app, currentSocket),
  [Messages.FILE_CREATED]: fileCreatedHandler(app, currentSocket),
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
        Messages.MOUSE_POSITION,
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
      memberSocket?.emit(Messages.KEYS_PRESSED, currentSocket.id, keysPressed);
    });
  };

const fileCreatedHandler =
  (app: Appdata, currentSocket: Socket) =>
  (roomId: string, createdFile: any) => {
    const room = getRoom(app, roomId);
    if (!room) return;
    room.directoryTree.selectedDirectory.appendFile(createdFile);
    room.members.forEach((member) => {
      if (member.id === currentSocket.id) return;
      const memberSocket = getSocket(app, member.id);
      memberSocket?.emit(Messages.FILE_CREATED, currentSocket.id, createdFile);
    });
  };

export default communication;
