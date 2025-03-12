import express from 'express';
import dotenv from 'dotenv';
import router from './routes/router.js';
import connectDB from './config/db.js'; 

dotenv.config();

class Server {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;
        this.init();
    }

    async init() {
        try {

            await connectDB();
            console.log('Database connected. Starting server...');
            
            this.middlewares();
            this.routes();
            this.start();
        } catch (error) {
            console.error('Error connecting to MongoDB:', error);
            process.exit(1);
        }
    }

    middlewares() {
        this.app.use(express.json());
    }

    routes() {
        this.app.use('/api', router);
    }

    start() {
        this.app.listen(this.port, () => {
            console.log(`Server running on port ${this.port}`);
        });
    }
}

new Server();
