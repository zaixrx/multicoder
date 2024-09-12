import io, { Socket } from "socket.io-client";
import { MousePosition } from "../components/CodeEditor";

let socket: Socket;
export function makeConnection() {
  socket = io("ws://127.0.0.1:3000");
  return socket;
}

export function sendRoomJoinRequest(socketToConnectToId: string) {
  socket.emit("roomJoinRequest", socketToConnectToId);
}

export function sendMousePosition(
  roomId: string,
  mousePosition: MousePosition
) {
  socket.emit("mousePosition", roomId, mousePosition);
}

export function sendKeysPressedBuffer(
  roomId: string,
  keysPressedBuffer: string[]
) {
  socket.emit("keysPressed", roomId, keysPressedBuffer);
}
