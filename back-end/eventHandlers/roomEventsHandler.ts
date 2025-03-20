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
import { roomMiddleware, fileMiddleware, folderMiddleware } from "./middlware";

const communication = (handle: Handle, client: Client): EventHandler => ({
  [Messages.ROOM_CREATE]: {
    eventHandler: roomCreatedHandler(handle, client),
    middlewares: [],
  },
  [Messages.ROOM_JOIN]: {
    eventHandler: roomJoinedHandler(handle, client),
    middlewares: [roomMiddleware],
  },
  [Messages.FILE_CREATED]: {
    eventHandler: fileCreatedHandler(handle, client),
    middlewares: [roomMiddleware],
  },
  [Messages.FILE_SELECTED]: {
    eventHandler: fileSelectedHandler(handle, client),
    middlewares: [roomMiddleware],
  },
  [Messages.FOLDER_CREATED]: {
    eventHandler: folderCreatedHandler(handle, client),
    middlewares: [roomMiddleware],
  },
  [Messages.FOLDER_SELECTED]: {
    eventHandler: folderSelectedHandler(handle, client),
    middlewares: [roomMiddleware, folderMiddleware],
    options: [/* folderNeedToExist: */ false],
  },
  [Messages.FILE_CONTENT_CHANGED]: {
    eventHandler: fileContentChanged(handle, client),
    middlewares: [roomMiddleware, fileMiddleware],
  },
  [Messages.NODE_NAME_CHANGED]: {
    eventHandler: nodeNameChangedHandler(handle, client),
    middlewares: [roomMiddleware, folderMiddleware],
  },
  [Messages.EXECUTE_CODE]: {
    eventHandler: executeCodeHandler(handle, client),
    middlewares: [],
  },
});

const roomCreatedHandler = (handle: Handle, client: Client) => (_: Request) => {
  const room: Room = createRoom(handle, [client], client.id);
  client.send(
    Messages.ROOM_JOIN,
    room.id,
    [...room.members.values()],
    room.directoryTree
  );
};

const roomJoinedHandler = (_: Handle, client: Client) => (req: Request) => {
  const room: Room = req.state.room;
  const [member] = joinRoom(room, [client], "");

  client.send(
    Messages.ROOM_JOIN,
    room.id,
    [...room.members.values()],
    room.directoryTree
  );
  client.broadcast(Messages.NEW_MEMBER, member);
};

const fileCreatedHandler = (_: Handle, client: Client) => (req: Request) => {
  const room: Room = req.state.room;
  const path: string[] = req.params[0];

  room.directoryTree.appendFile(path);

  client.broadcast(Messages.FILE_CREATED, path);
};

const fileSelectedHandler = (_: Handle, client: Client) => (req: Request) => {
  const room = req.state.room;
  const [path] = req.params;

  room.directoryTree.selectedFile = req.state.file;

  client.broadcast(Messages.FILE_SELECTED, path);
};

const fileContentChanged = (_: Handle, client: Client) => (req: Request) => {
  const { file, member } = req.state;
  const [filePath, fileContent, position, selection] = req.params;

  file.content[position.line] = fileContent;

  member.cursorPosition = position;
  member.cursorSelection = selection;

  client.broadcast(
    Messages.FILE_CONTENT_CHANGED,
    member.id,
    filePath,
    fileContent,
    position,
    selection
  );
};

const folderCreatedHandler = (_: Handle, client: Client) => (req: Request) => {
  const room: Room = req.state.room;
  const path: string[] = req.params[0];

  room.directoryTree.appendFolder(path);

  client.broadcast(Messages.FOLDER_CREATED, path);
};

const folderSelectedHandler = (_: Handle, client: Client) => (req: Request) => {
  const room: Room = req.state.room;
  const path: string[] = req.params[0];

  room.directoryTree.selectedFolder = path ? req.state.folder : null;

  client.broadcast(Messages.FOLDER_SELECTED, path);
};

const executeCodeHandler = (_: Handle, client: Client) => (req: Request) => {
  client.broadcast(Messages.EXECUTE_CODE);
};

const nodeNameChangedHandler =
  (_: Handle, client: Client) => (req: Request) => {
    const { node } = req.state;
    const path: string[] = req.params[0];

    node.name = path[path.length - 1];

    client.broadcast(Messages.NODE_NAME_CHANGED, path);
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

function joinRoom(room: Room, clients: Client[], ownerId: string): Member[] {
  const o = Math.round,
    r = Math.random,
    s = 255;

  const members: Member[] = [];

  clients.forEach((client) => {
    const member = {
      id: client.id,
      isOwner: ownerId ? ownerId === client.id : false,
      cursorPosition: { line: 0, column: 0 },
      cursorSelection: {
        start: { line: 0, column: 0 },
        end: { line: 0, column: 0 },
      },
      color: { r: o(r() * s), g: o(r() * s), b: o(r() * s) },
    };

    room.members.set(client.id, member);

    members.push(member);

    client.joinedRoom = room.id;
    client.socket.join(room.id);
  });

  return members;
}
