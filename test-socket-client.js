import { io } from "socket.io-client";

const SERVER_URL = "http://localhost:3000";

const socket = io(SERVER_URL, {
  transports: ["websocket"],
});

socket.on("connect", () => {
  console.log("Connected to Server");
});

socket.on("summaryUpdate", (data) => {
  console.log("Real time summary update received:", data);
});

socket.on("disconnect", () => {
  console.log("Disconnected from server");
});

socket.on("connect_error", (error) => {
  console.error("Connection error:", error);
});
