import io, { Socket } from "socket.io-client";
import { Vector2 } from "../common/Interpolater";
import { MouseClick } from "../components/CodeArea";

let socket: Socket;
export function makeConnection() {
  socket = io("ws://127.0.0.1:3000");
  return socket;
}

export function sendRoomJoinRequest(socketToConnectToId: string) {
  socket.emit("roomJoinRequest", socketToConnectToId);
}

export function sendMousePosition(roomId: string, mousePosition: Vector2) {
  socket.emit("mousePosition", roomId, mousePosition);
}

export function sendKeysPressedBuffer(
  roomId: string,
  keysPressedBuffer: string[]
) {
  socket.emit("keysPressed", roomId, keysPressedBuffer);
}

export function sendMouseClicksBuffer(
  roomId: string,
  mouseClicksBuffer: MouseClick[]
) {
  socket.emit("mouseClicks", roomId, mouseClicksBuffer);
}
