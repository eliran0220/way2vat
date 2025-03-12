
import S3Service from "./aws/aws-service.js";
import csv from 'csv-parser'
import { Readable } from "stream";
import Expense from "../database/models/expense.js";
import Report from "../database/models/report.js";
import Summary from "../database/models/summary.js"; 
import companiesConfig from '../config/companies_config.json' with { type: 'json' };
class Service {
    constructor() {
        this.aws_service = S3Service;
        this.batchSize = 100;
        this.configuredCompanies = new Set(companiesConfig.configuredCompanies);
        this.summary = { Completed: 0, Failed: 0, Excluded: 0, totalReports: 0 };
        this.reportsSet = new Set(); 
        this.reportUpdates = new Map();
    }
    processFile = async () => {
        const batch = []
        const proccecedData = []
        
        const fileStream = await this.aws_service.getFileFromS3(process.env.AWS_BUCKET_CSV,"expenses_new.csv");
    
        return new Promise((resolve, reject) => {
            fileStream.pipe(csv({ headers: true })) .on("data", async (expense) => {
                const processTask = (async () => {
                    try {

                        if (!this.reportsSet.has(expense.reportId)) {
                            this.reportsSet.add(expense.reportId);
                            this.summary.totalReports += 1;
                        }

                        const { category, company, reportId, amount } = await this.classifyExpenseToCategory(expense);
                        batch.push({ ...expense, category });

                        if (category === "Completed") {
                            this.updateReport(reportUpdates, company, reportId, amount);
                        }

                        if (batch.length >= this.batchSize) {
                            await this.saveExpensesBatch(batch);
                            batch.length = 0;
                        }

                    } catch (error) {
                        console.error("Error processing expense:", error);
                    }
                })();

                proccecedData.push(processTask);
            })
            .on("end", async () => {
                try {
                    await Promise.allSettled(proccecedData);
                    
                    if (batch.length > 0) await this.saveExpensesBatch(batch);
                    
                    resolve({ message: "File processed successfully", summary: this.summary });
                } catch (error) {
                    reject(error);
                }
            })
            .on("error", (error) => reject(error));
        })
    }

    updateReport = (reportUpdates, company, reportId, amount) => {
        const reportKey = `${company}-${reportId}`;
    
        if (!reportUpdates.has(reportKey)) {
            reportUpdates.set(reportKey, { company, reportId, totalAmountCompleted: 0, expenseCount: 0 });
        }
    
        const report = reportUpdates.get(reportKey);
        report.totalAmountCompleted += amount;
        report.expenseCount += 1;
    };

    classifyExpenseToCategory = async (expense) => {
        let category = null;
        const { company, reportId, amount, imageUrl } = expense;
    
        if (!this.configuredCompanies.has(company)) {
            this.summary.Excluded += 1;
            category = "Excluded";
        } else if (!await this.isValidExpense(amount, imageUrl)) {
            this.summary.Failed += 1;
            category = "Failed";
        } else {
            this.summary.Completed += 1;
            category = "Completed";
        }
    
        return { category, company, reportId, amount: parseFloat(amount) };
    };

    isValidExpense = async (amount, imageUrl) => {
        const parsedAmount = parseFloat(amount);
        if (!parsedAmount || parsedAmount === 0) return false;
        
        const imageExists = await this.aws_service.isFileExistsInS3(process.env.AWS_BUCKET_IMAGES, imageUrl);
        return !!imageExists;
    }

    saveExpensesBatch = async (batch) => {
        await Expense.insertMany(batch);
    }
}

export default new Service();