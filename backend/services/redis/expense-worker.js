import { expenseQueue } from "./redis-queue.js";
import S3Service from "../aws/aws-service.js";
import Expense from "../../database/models/expense.js";
import companiesConfig from "../../config/companies_config.json" with { type: "json" };

class ExpenseWorker {
    constructor(redisConnection) {
        this.configuredCompanies = new Set(companiesConfig.configuredCompanies);
        this.batch = [];
        this.batchSize = 20;
        this.reportUpdates = new Map();
        this.summary = { Completed: 0, Failed: 0, Excluded: 0, totalReports: 0 };
        this.reportsSet = new Set(); 

        expenseQueue.processJobs((job, done) => this.processExpense(job, done));
    }

    processExpense = async (job, done) => {
        try {
            const expense = job.data;

            const { category, company, reportId, amount } = await this.classifyExpenseToCategory(expense);

            this.batch.push({ ...expense, category });

            if (!this.reportsSet.has(expense.reportId)) {
                this.reportsSet.add(expense.reportId);
                this.summary.totalReports += 1;
            }

            if (category === "Completed") {
                this.updateReport(reportUpdates,company, reportId, amount);
            }

            if (this.batch.length >= this.batchSize) {
                await this.saveExpensesBatch(this.batch);
                this.batch = [];
            }

            done();
        } catch (error) {
            console.error("Error processing expense:", error);
            done(error);
        }
    };

    classifyExpenseToCategory = async (expense) => {
        let category = null;
        const { company, reportId, amount, imageUrl } = expense;

        if (!this.configuredCompanies.has(company)) {
            category = "Excluded";
        } else if (!(await this.isValidExpense(amount, imageUrl))) {
            category = "Failed";
        } else {
            category = "Completed";
        }

        return { category, company, reportId, amount: parseFloat(amount) };
    };

    isValidExpense = async (amount, imageUrl) => {
        const parsedAmount = parseFloat(amount);
        if (!parsedAmount || parsedAmount === 0) return false;

        const imageExists = await S3Service.isFileExistsInS3(process.env.AWS_BUCKET_IMAGES, imageUrl);
        return !!imageExists;
    };

    updateReport = (reportUpdates, company, reportId, amount) => {
        const reportKey = `${company}-${reportId}`;
    
        if (!reportUpdates.has(reportKey)) {
            reportUpdates.set(reportKey, { company, reportId, totalAmountCompleted: 0, expenseCount: 0 });
        }
    
        const report = reportUpdates.get(reportKey);
        report.totalAmountCompleted += amount;
        report.expenseCount += 1;
    };

    saveExpensesBatch = async (batch) => {
        await Expense.insertMany(batch);
    };
}

export default new ExpenseWorker();
