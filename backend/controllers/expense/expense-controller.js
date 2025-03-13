import service from '../../services/expense/expense-service.js'

class Controller {
    constructor() {
        this.service = service;
    }


    processFile = async (req,res) => {
        try {
            const result = await this.service.processFile();
            
            if (result) {
                return res.status(200).json(result)
            } 
            
        } catch (err) {
            res.status(500).json(err)
        }
    }

    getExpenseById = async (req, res) => {
        try {
            const result = await this.service.getExpenseById(req.params.id)
             if (result) {
                return res.status(200).json(result)
            } else {
                return res.status(200).json("No expense found with this id")
            }
        } catch (err) {
            res.status(500).json(err)
        }
    }
}

export default new Controller();
