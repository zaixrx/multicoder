import io from "socket.io-client";

export function makeConnection() {
  return io("ws://127.0.0.1:3000");
}