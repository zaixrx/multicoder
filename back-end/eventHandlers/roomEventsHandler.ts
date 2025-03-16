import {
  Client,
  EventHandler,
  Handle,
  Request,
} from "./assets/types/socketTypes";
import { Messages } from "./assets/types/messageTypes";
import { Member, Room } from "./assets/types/roomTypes";
import DirectoryTree from "./assets/directoryTree";
import { ObjectId } from "bson";

function roomMiddleware(handle: Handle, req: Request) {
  const roomID: string = req.params[0];
  const room: Room | undefined = handle.app.rooms.get(roomID);
  if (!room) {
    req.status = -1;
    req.state.error = "Room Not Found";
    return;
  }

  req.state.room = room;
}

const communication = (handle: Handle, client: Client): EventHandler => ({
  [Messages.ROOM_CREATED]: {
    eventHandler: roomCreatedHandler(handle, client),
    middlewares: [],
  },
  [Messages.ROOM_JOINED]: {
    eventHandler: roomJoinedHandler(handle, client),
    middlewares: [roomMiddleware],
  },
  [Messages.FILE_CREATED]: {
    eventHandler: fileCreatedHandler(handle, client),
    middlewares: [],
  },
  [Messages.FILE_SELECTED]: {
    eventHandler: fileSelectedHandler(handle, client),
    middlewares: [],
  },
  [Messages.FOLDER_CREATED]: {
    eventHandler: folderCreatedHandler(handle, client),
    middlewares: [],
  },
  [Messages.FOLDER_SELECTED]: {
    eventHandler: folderSelectedHandler(handle, client),
    middlewares: [],
  },
  [Messages.FILE_CONTENT_CHANGED]: {
    eventHandler: fileContentChanged(handle, client),
    middlewares: [],
  },
  [Messages.NODE_NAME_CHANGED]: {
    eventHandler: nodeNameChangedHandler(handle, client),
    middlewares: [],
  },
  [Messages.EXECUTE_CODE]: {
    eventHandler: executeCodeHandler(handle, client),
    middlewares: [],
  },
});

const roomCreatedHandler = (handle: Handle, client: Client) => (_: Request) => {
  const room: Room = createRoom(handle, [client], client.id);
  client.send(Messages.ROOM_CREATED, room);
};

const roomJoinedHandler = (_: Handle, client: Client) => (req: Request) => {
  const room: Room = req.state.room;
  joinRoom(room, [client], "");
  client.send(Messages.ROOM_JOINED, room);
};

const fileCreatedHandler =
  (handle: Handle, client: Client) => (req: Request) => {
    const room: Room = req.state.room;
    const [createdFileName] = req.params;

    room.directoryTree.appendFileToSelectedDir(createdFileName);

    client.broadcast(Messages.FILE_CREATED, createdFileName);
  };

const fileSelectedHandler = (_: Handle, client: Client) => (req: Request) => {
  const room = req.state.room;
  const [path] = req.params;

  room.directoryTree.selectedFile = path ? req.state.file : null;

  client.broadcast(Messages.FILE_SELECTED, path);
};

const fileContentChanged = (_: Handle, client: Client) => (req: Request) => {
  const { file, member } = req.state;
  const [path, content, position, selection] = req.params;

  file.content[position.line] = content;
  member.cursorPosition = position;
  member.cursorSelection = selection;

  client.broadcast(
    Messages.FILE_CONTENT_CHANGED,
    path,
    content,
    position,
    selection
  );
};

const folderCreatedHandler = (_: Handle, client: Client) => (req: Request) => {
  const room: Room = req.state.room;
  const [createdFolderName] = req.params;

  room.directoryTree.appendFolderToSelectedDir(createdFolderName);

  client.broadcast(Messages.FOLDER_CREATED, createdFolderName);
};

const folderSelectedHandler = (_: Handle, client: Client) => (req: Request) => {
  const room: Room = req.state.room;
  const [path] = req.params;

  room.directoryTree.selectedFolder = path ? req.state.folder : null;
  client.broadcast(Messages.FOLDER_SELECTED, path);
};

const executeCodeHandler = (_: Handle, client: Client) => (req: Request) => {
  client.broadcast(Messages.EXECUTE_CODE);
};

const nodeNameChangedHandler =
  (_: Handle, client: Client) => (req: Request) => {
    const { node } = req.state;
    const [nodePath, newName] = req.params;

    node.name = newName;

    client.broadcast(Messages.NODE_NAME_CHANGED, nodePath, newName);
  };

export default communication;

function createRoom(handle: Handle, clients: Client[], ownerId: string): Room {
  const room: Room = {
    id: new ObjectId().toString(),
    members: new Map<string, Member>(),
    directoryTree: new DirectoryTree(),
  };

  handle.app.rooms.set(room.id, room);
  joinRoom(room, clients, ownerId);

  return room;
}

function joinRoom(room: Room, clients: Client[], ownerId: string) {
  const o = Math.round,
    r = Math.random,
    s = 255;

  clients.forEach((client) => {
    room.members.set(client.id, {
      isOwner: ownerId ? ownerId === client.id : false,
      id: client.id,
      cursorPosition: { line: 0, column: 0 },
      cursorSelection: {
        start: { line: 0, column: 0 },
        end: { line: 0, column: 0 },
      },
      color: { r: o(r() * s), g: o(r() * s), b: o(r() * s) },
    });

    client.joinedRoom = room.id;
    client.socket.join(room.id);
  });
}
