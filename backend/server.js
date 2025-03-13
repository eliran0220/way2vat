import express from "express";
import dotenv from "dotenv";
import router from "./src/routes/expense-router.js";
import connectDB from "./src/config/db-config.js";
import SocketService from "./src/services/io_socket/io_socket.js";
import ExpenseWorker from "./src/services/redis/redis-expense-worker.js";
import http from "http";

dotenv.config();

class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.server = http.createServer(this.app);
    this.socketService = null;
    this.expenseWorker = null;

    this.initMiddlewares();
    this.initRoutes();
  }

  initMiddlewares = () => {
    this.app.use(express.json());
    console.log("Middlewares initialized.");
  };

  initRoutes = () => {
    this.app.use("/api", router);
    console.log("Routes initialized.");
  };

  start = async () => {
    try {
      await connectDB();
      console.log("Database connected. Starting server...");

      this.socketService = new SocketService(this.server);
      this.expenseWorker = new ExpenseWorker(this.socketService);

      this.server.listen(this.port, () => {
        console.log(`Server running on port ${this.port}`);
      });
    } catch (error) {
      tconsole.log({ msg: "Error starting the server", error });
      process.exit(1);
    }
  };
}

const server = new Server();
server.start();
