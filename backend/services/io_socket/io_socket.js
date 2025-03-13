import { Server } from "socket.io";
import service from '../expense/expense-service.js'

class SocketService {
    constructor(server) {
        this.io = new Server(server, { cors: { origin: "*" } });

        this.io.on("connection", async (socket) => {
            console.log("⚡ Client connected to WebSocket");

            await this.sendLatestSummary(socket);

            socket.on("disconnect", () => {
                console.log("⚡ Client disconnected");
            });
        });
    }

    async sendLatestSummary(socket) {
        try {
            const summary = await service.getSummary();
            socket.emit("summaryUpdate", summary);
        } catch (error) {
            console.error("❌ Error sending summary update:", error);
        }
    }

    emitSummaryUpdate(summaryData) {
        this.io.emit("summaryUpdate", summaryData);
        console.log("📡 Summary update emitted to all clients:", summaryData);
    }
}

export default SocketService;
