import { io } from "socket.io-client";

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(import.meta.env.VITE_SERVER_URL || "", {
      autoConnect: false,
      transports: ["websocket", "polling"],
      // Keep alive aggressively — critical for mobile backgrounding
      pingTimeout: 60000,      // wait 60s before declaring dead
      pingInterval: 10000,     // ping every 10s
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
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