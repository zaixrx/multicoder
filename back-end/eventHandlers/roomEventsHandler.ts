import { Client, EventHandler } from "./assets/types/socketTypes";
import { Handle } from "./eventsHandlers";
import { Member, Room } from "./assets/types/roomTypes";
import DirectoryTree, { FileNode, FolderNode } from "./assets/directoryTree";
import { CursorPosition, CursorSelection, KeyPress, Messages, Vector2 } from "./assets/types/messageTypes";
import Queue from "./assets/queue";

const communication = (handle: Handle, client: Client): EventHandler => ({
  [Messages.ROOM_JOIN_REQUEST]: roomJoinRequestHandler(handle, client),
  [Messages.ROOM_JOIN_RESPONSE]: roomJoinResponseHandler(handle, client),

  [Messages.FILE_CREATED]: fileCreatedHandler(handle, client),
  [Messages.FILE_SELECTED]: fileSelectedHandler(handle, client),
  [Messages.FILE_CONTENT_CHANGED]: fileContentChanged(handle, client),
  
  [Messages.FOLDER_CREATED]: folderCreatedHandler(handle, client),
  [Messages.FOLDER_SELECTED]: folderSelectedHandler(handle, client),

  [Messages.MEMBER_CURSOR_CHANGED]: memberCursorChangedHandler(handle, client),
  [Messages.EXECUTE_CODE]: executeCodeHandler(handle, client),
});

const roomJoinRequestHandler =
  (handle: Handle, client: Client) => (clientToConnectToId: string) => {
    handle.uf.emitToClient(clientToConnectToId, Messages.ROOM_JOIN_REQUEST, client.id);
  };

const roomJoinResponseHandler =
  (handle: Handle, client: Client) =>
  (clientWhoRequestedToJoinId: string, accpetedReqeust: boolean) => {
    const clientWhoRequestedToJoin = handle.uf.getClient(clientWhoRequestedToJoinId);
    if (!clientWhoRequestedToJoin) return;

    if (accpetedReqeust) {
      const clients = [client, clientWhoRequestedToJoin];
      createRoom(handle, clients, client.id);
    } else {
      clientWhoRequestedToJoin.send(Messages.ROOM_JOIN_DECLINED, client.id);
    }
  };

function createRoom(handle: Handle, clients: Client[], ownerId: string) {
  const cursorDefault: CursorPosition = { line: 0, column: 0 };

  const o = Math.round, r = Math.random, s = 255;

  const room: Room = {
    id: crypto.randomUUID(),
    members: clients.map((c): Member => (
      {
        id: c.id,
        isOwner: c.id === ownerId,
        cursorPosition: cursorDefault,
        cursorSelection: { start: cursorDefault, end: cursorDefault },
        mousePositionQueue: (new Queue<Vector2>()),
        color: { r: o(r() * s), g: o(r() * s), b: o(r() * s) }
      }
    )),
    directoryTree: new DirectoryTree(),
  };

  clients.forEach(c => {
    c.send(Messages.ROOM_CREATED, room);
  })
  handle.app.rooms.push(room);

  return room;
}

const fileCreatedHandler = (handle: Handle, client: Client) => (
  (roomId: string, createdFileName: string) => {
    const room = handle.uf.getRoom(roomId);
    if (!room) return;

    room.directoryTree.appendFileToSelectedDir(createdFileName);
    room.members.forEach((m: Member) => {
      if (m.id === client.id) return;

      const memberClient = handle.uf.getClient(m.id);
      memberClient?.send(Messages.FILE_CREATED, createdFileName);
    });
  }
);

const fileSelectedHandler = (handle: Handle, client: Client) => (
  (roomId: string, path: string[] | undefined) => {
    const room = handle.uf.getRoom(roomId);
    if (!room) return;

    if (path) {
      const file = room.directoryTree.findNode(path);
      if (! (file && file instanceof FileNode) ) return;
      room.directoryTree.selectedFile = file;
    } else {
      room.directoryTree.selectedFile = undefined;
    }

    room.members.forEach((m: Member) => {
      if (m.id === client.id) return;

      const memberClient = handle.uf.getClient(m.id);
      memberClient?.send(Messages.FILE_SELECTED, path);
    });
  }
);

const fileContentChanged = (handle: Handle, client: Client) => (
  (roomId: string, path: string[], content: string[]) => {
    const room = handle.uf.getRoom(roomId);
    if (!room) return;

    const file = room.directoryTree.findNode(path);
    if (! (content && file && file instanceof FileNode) ) return;

    file.content = content;

    room.members.forEach((m: Member) => {
      if (m.id === client.id) return;

      const memberClient = handle.uf.getClient(m.id);
      memberClient?.send(Messages.FILE_CONTENT_CHANGED, path, content);
    });
  }
);

const folderCreatedHandler = (handle: Handle, client: Client) => (
  (roomId: string, createdFolderName: string) => {
    const room = handle.uf.getRoom(roomId);
    if (!room) return;

    room.directoryTree.appendFolderToSelectedDir(createdFolderName);
    room.members.forEach((m: Member) => {
      if (m.id === client.id) return;

      const memberClient = handle.uf.getClient(m.id);
      memberClient?.send(Messages.FOLDER_CREATED, createdFolderName);
    });
  }
);

const folderSelectedHandler = (handle: Handle, client: Client) => (
  (roomId: string, path: string[] | undefined) => {
    const room = handle.uf.getRoom(roomId);
    if (!room) return;

    if (path) {
      const folder = room.directoryTree.findNode(path);
      if (! (folder && folder instanceof FolderNode) ) return;
      room.directoryTree.selectedFolder = folder;
    } else {
      room.directoryTree.selectedFolder = undefined;
    }

    room.members.forEach((m: Member) => {
      if (m.id === client.id) return;

      const memberClient = handle.uf.getClient(m.id);
      memberClient?.send(Messages.FOLDER_SELECTED, path);
    });
  }
);

const memberCursorChangedHandler = (handle: Handle, client: Client) => (
  (roomId: string, memberId: string, position: CursorPosition, selection: CursorSelection) => {
    const room = handle.uf.getRoom(roomId);
    if (!room) return;

    const member = room.members.find(m => m.id === memberId);
    if (!member) return;

    member.cursorPosition = position;
    member.cursorSelection = selection;

    room.members.forEach((m: Member) => {
      if (m.id === client.id) return;

      const memberClient = handle.uf.getClient(m.id);
      memberClient?.send(Messages.MEMBER_CURSOR_CHANGED, memberId, position, selection);
    });
  }
);

const executeCodeHandler = (handle: Handle, client: Client) => (
  (roomId: string) => {
    const room = handle.uf.getRoom(roomId);
    if (!room) return;

    room.members.forEach((m: Member) => {
      if (m.id === client.id) return;

      const memberClient = handle.uf.getClient(m.id);
      memberClient?.send(Messages.EXECUTE_CODE);
    });
  }
);

export default communication;
