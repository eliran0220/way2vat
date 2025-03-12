import service from '../services/service.js'

class Controller {
    constructor() {
        this.service = service;
    }


    processFile = async (req,res) => {
        const result = await this.service.processFile();
    }
}

export default new Controller();
