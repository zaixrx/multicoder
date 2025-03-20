import { Room } from "./assets/types/roomTypes";
import { NodeType } from "./assets/directoryTree";
import { Request, Handle, Client } from "./assets/types/socketTypes";

export function roomMiddleware(handle: Handle, __: Client, req: Request) {
  const roomID: string = req.params[0];
  req.params.splice(0, 1);
  const room: Room | undefined = handle.app.rooms.get(roomID);

  if (!room) {
    req.status = -1;
    req.state.error = "Room doesn't exist";
    return;
  }

  req.state.room = room;
}

export function nodeMiddleware(_: Handle, __: Client, req: Request) {
  const nodePath: string[] = req.params[0];
  const room: Room = req.state.room;
  const node = room.directoryTree.getNode(nodePath);

  if (!node) {
    req.status = -1;
    req.state.error = "Node doesn't exist";
    return;
  }

  req.state.folder = node;
}

export function folderMiddleware(
  _: Handle,
  __: Client,
  req: Request,
  folderNeedToExist = true
) {
  const folderPath: string[] = req.params[0];
  const room: Room = req.state.room;
  const folder = room.directoryTree.getNode(folderPath);

  if (!folder && folderNeedToExist) {
    req.status = -1;
    req.state.error = "Folder doesn't exist";
    return;
  }
  if (folder?.type !== NodeType.FOLDER_NODE && folderNeedToExist) {
    req.status = -1;
    req.state.error = `${folderPath} isn't a Folder`;
    return;
  }

  req.state.folder = folder;
}

export function fileMiddleware(_: Handle, __: Client, req: Request) {
  const filePath: string[] = req.params[0];
  const room: Room = req.state.room;
  const file = room.directoryTree.getNode(filePath);

  if (!file) {
    req.status = -1;
    req.state.error = "File doesn't exist";
    return;
  }
  if (file.type !== NodeType.FILE_NODE) {
    req.status = -1;
    req.state.error = `${filePath} is not a File`;
    return;
  }

  req.state.file = file;
}
