import { io } from "socket.io-client";

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(import.meta.env.VITE_SERVER_URL || window.location.origin, {
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}

export function destroySocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
