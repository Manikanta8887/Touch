import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});

socket.on("connect", () => console.log("⚡ Socket connected:", socket.id));
socket.on("connect_error", (err) => console.warn("⚡ Socket connection warning:", err.message));

export default socket;
