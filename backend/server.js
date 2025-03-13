import express from "express";
import dotenv from "dotenv";
import router from "./routes/expense-router.js";
import connectDB from "./config/db-config.js";
import SocketService from "./services/io_socket/io_socket.js";
import ExpenseWorker from "./services/redis/redis-expense-worker.js";
import http from "http";
import pino from "pino";

dotenv.config();

class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.server = http.createServer(this.app);
    this.socketService = null;
    this.expenseWorker = null;

    this.logger = pino({
      level: process.env.LOG_LEVEL || "info",
      transport: {
        target: "pino-pretty",
        options: { colorize: true },
      },
    });

    this.initMiddlewares();
    this.initRoutes();
  }

  initMiddlewares() {
    this.app.use(express.json());
    this.logger.info("Middlewares initialized.");
  }

  initRoutes() {
    this.app.use("/api", router);
    this.logger.info("Routes initialized.");
  }

  async start() {
    try {
      await connectDB();
      this.logger.info("Database connected. Starting server...");

      this.socketService = new SocketService(this.server);
      this.expenseWorker = new ExpenseWorker(this.socketService);

      this.server.listen(this.port, () => {
        this.logger.info(`Server running on port ${this.port}`);
      });
    } catch (error) {
      this.logger.error({ msg: "Error starting the server", error });
      process.exit(1);
    }
  }
}

const server = new Server();
server.start();
