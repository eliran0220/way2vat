import { Server } from "socket.io";
import service from "../expense/expense-service.js";

class SocketService {
  constructor(server) {
    this.io = new Server(server, { cors: { origin: "*" } });
    this.setupSocketEvents();
  }

  setupSocketEvents = () => {
    this.io.on("connection", async (socket) => {
      console.log("Client connected to WebSocket");

      try {
        await this.sendLatestSummary(socket);
      } catch (error) {
        console.error("Error handling initial summary send:", error);
      }

      socket.on("disconnect", () => {
        console.log("Client disconnected");
      });
    });
  };

  sendLatestSummary = async (socket) => {
    try {
      const summary = await service.getSummary();
      socket.emit("summaryUpdate", summary);
    } catch (error) {
      console.error("Error sending summary update:", error);
    }
  };

  emitSummaryUpdate = (summaryData) => {
    try {
      this.io.emit("summaryUpdate", summaryData);
      console.log("Summary update emitted to all clients:", summaryData);
    } catch (error) {
      console.error("Error emitting summary update:", error);
    }
  };
}

export default SocketService;
