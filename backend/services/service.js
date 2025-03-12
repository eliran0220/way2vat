
import S3Service from "./aws/aws-service.js";
import csv from 'csv-parser'
import { Readable } from "stream";
import Expense from "../database/models/expense.js";
import Report from "../database/models/report.js";
import Summary from "../database/models/summary.js"; 
import cofig from '../config/companies_config.json';
class Service {
    constructor() {
        this.aws_service = S3Service;
        this.batchSize = 100;
        this.configuredCompanies = new Set(config.configuredCompanies);
        this.summary = { Completed: 0, Failed: 0, Excluded: 0, totalReports: 0 };
        this.reportsSet = new Set(); // Track unique reports

    }
    processFile = async () => {
        const batch = []
        const proccecedData = []
        
        const fileStream = await this.aws_service.getFile(process.env.AWS_BUCKET,"expenses_new.csv");
    
        return new Promise((resolve, reject) => {
            Readable.from(fileStream)
            .pipe(csv({ headers: true })) 
            .on("data", async (expense) => {
                const { reportId, company, amount, imageUrl } = expense;
                const result = await this.classifyExpenseToCategory(expense)
                

                
            } )
        })
    }

    classifyExpenseToCategory = async (expense) => {
        let category = null;
        
    }

}

export default new Service();