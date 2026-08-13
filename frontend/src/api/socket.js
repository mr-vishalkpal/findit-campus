import { io } from "socket.io-client";

let socket = null;

export function getSocket() {
  if (!socket) {
    const token = localStorage.getItem("token");
    const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
    socket = io(socketUrl, {
      auth: { token },
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}