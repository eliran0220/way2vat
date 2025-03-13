import express from 'express';
import dotenv from 'dotenv';
import router from './routes/expense-router.js';
import connectDB from './config/db-config.js'; 
import SocketService from "./services/io_socket/io_socket.js";
import ExpenseWorker from "./services/redis/redis-expense-worker.js";
import http from "http";

dotenv.config();

class Server {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;
        this.server = http.createServer(this.app); 
        this.socketService = null;
        this.expenseWorker = null;

        this.init();
    }

    async init() {
        try {
            await connectDB();
            console.log('Database connected. Starting server...');
            
            this.initMiddlewares();
            this.initRoutes();

            this.socketService = new SocketService(this.server);

            this.expenseWorker = new ExpenseWorker(this.socketService);
            
            this.startServer();
        } catch (error) {
            console.error('Error connecting to MongoDB:', error);
            process.exit(1);
        }
    }

    initMiddlewares() {
        this.app.use(express.json());
    }

    initRoutes() {
        this.app.use('/api', router);
    }

    startServer() {
        this.app.listen(this.port, () => {
            console.log(`Server running on port ${this.port}`);
        });
    }
}

new Server();
