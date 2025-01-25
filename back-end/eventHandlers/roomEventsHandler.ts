import { Client, EventHandler } from "./assets/types/socketTypes";
import { Handle } from "./eventsHandlers";
import { Member, Room } from "./assets/types/roomTypes";
import DirectoryTree from "./assets/directoryTree";
import { KeyPress, Messages, Vector2 } from "./assets/types/messageTypes";
import Queue from "./assets/queue";

const communication = (handle: Handle, client: Client): EventHandler => ({
  [Messages.ROOM_JOIN_REQUEST]: roomJoinRequestHandler(handle, client),
  [Messages.ROOM_JOIN_RESPONSE]: roomJoinResponseHandler(handle, client),
  [Messages.MOUSE_POSITION]: mousePositionHandler(handle, client),
  [Messages.KEYS_PRESSED]: keysPressedHandler(handle, client),
  [Messages.FILE_CREATED]: fileCreatedHandler(handle, client),
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
      createRoom(handle, clients);
    } else {
      clientWhoRequestedToJoin.send(Messages.ROOM_JOIN_DECLINED, client.id);
    }
  };

function createRoom(handle: Handle, clients: Client[]) {
  const room: Room = {
    id: crypto.randomUUID(),
    members: clients.map((c) => (
      {
        id: c.id,
        mousePositionBuffer: (new Queue<Vector2>()),
      }
    )),
    directoryTree: {} as DirectoryTree,
  };

  handle.uf.emitToEveryone(Messages.ROOM_CREATED, room);
  handle.app.rooms.push(room);

  return room;
}

const mousePositionHandler =
  (handle: Handle, client: Client) =>
  (roomId: string, mousePosition: Vector2) => {
    const room = handle.uf.getRoom(roomId);
    if (!room) return;

    room.members.forEach((m: Member) => {
      if (m.id === client.id) return;

      const memberSocket = handle.uf.getClient(m.id);
      memberSocket?.send(
        Messages.MOUSE_POSITION,
        client.id,
        mousePosition
      );
    });
  };

const keysPressedHandler =
  (handle: Handle, client: Client) =>
  (roomId: string, keyPresses: KeyPress[]) => {
    const room = handle.uf.getRoom(roomId);
    if (!room) return;
 
    room.members.forEach((m: Member) => {
      if (m.id === client.id) return;

      const memberSocket = handle.uf.getClient(m.id);
      memberSocket?.send(Messages.KEYS_PRESSED, client.id, keyPresses);
    });
  };

const fileCreatedHandler =
  (handle: Handle, client: Client) =>
  (roomId: string, createdFile: any) => {
    const room = handle.uf.getRoom(roomId);
    if (!room) return;

    room.directoryTree.selectedDirectory.appendFile(createdFile);
    room.members.forEach((m: Member) => {
      if (m.id === client.id) return;

      const member = handle.uf.getClient(client.id);
      member?.send(Messages.FILE_CREATED, member.id, createdFile);
    });
  };

export default communication;
