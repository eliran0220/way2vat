
import express from 'express';
import controller from '../controllers/controller.js';
class ConversionRouter {
    constructor(){
        this.router = express.Router()
        this.initRoutes();
    }

    initRoutes(){
        this.router.post('/processFile',controller.processFile)

    }

    getRouter(){
        return this.router;
    }
}

export default new ConversionRouter().getRouter();
