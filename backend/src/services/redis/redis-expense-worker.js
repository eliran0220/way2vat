import { expenseQueue } from "./redis-queue.js";
import S3Service from "../aws/aws-service.js";
import Expense from "../../database/models/expense.js";
import companiesConfig from "../../config/companies-config.json" assert { type: "json" };
import redisConnection from "./redis-connection.js";
import ExpenseSummary from "../../database/models/summary.js";

class ExpenseWorker {
  constructor(socketService) {
    this.configuredCompanies = new Set(companiesConfig.configuredCompanies);
    this.batch = [];
    this.batchSize = 20;
    this.summary = { Completed: 0, Failed: 0, Excluded: 0, totalReports: 0 };
    this.reportsSet = new Set();
    this.saveTimeout = null;
    this.socketService = socketService;

    expenseQueue.processJobs(10, this.processExpense);

    this.startPeriodicSave();
  }

  processExpense = async (job, done) => {
    try {
      const expense = job.data;

      const { category, company, reportId, amount } =
        await this.classifyExpenseToCategory(expense);

      this.batch.push({ ...expense, category });

      if (!this.reportsSet.has(expense.reportId)) {
        this.reportsSet.add(expense.reportId);
        this.summary.totalReports += 1;
      }

      if (category === "Completed") {
        this.summary.Completed += 1;
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
  
  startPeriodicSave = () => {
    this.saveTimeout = setInterval(async () => {
      try {
        if (this.batch.length > 0) {
          console.log("Saving batch size:", this.batch.length);
          await this.saveExpensesBatch(this.batch);
          console.log("Batch saved!");

          await this.updateExpenseSummary();

          this.batch = [];
        }
      } catch (error) {
        console.error("Error in periodic save:", error);
      }
    }, 5000);
  };

  updateExpenseSummary = async () => {
    try {
      const totalReports = this.summary.totalReports;
      const completedCount = this.summary.Completed;
      const failedCount = this.summary.Failed;
      const excludedCount = this.summary.Excluded;

      const summaryData = {
        totalReports,
        completedCount,
        failedCount,
        excludedCount,
        lastUpdated: new Date(),
      };

      await ExpenseSummary.findOneAndUpdate({}, summaryData, {
        upsert: true,
        new: true,
      });

      await redisConnection.set(
        "summary:data",
        JSON.stringify(summaryData),
        "EX",
        60
      );

      this.socketService.emitSummaryUpdate(summaryData);
    } catch (error) {
      console.error("Error updating summary:", error);
    }
  };

  classifyExpenseToCategory = async (expense) => {
    try {
      let category = null;
      const { company, reportId, amount, imageUrl } = expense;

      if (!this.configuredCompanies.has(company)) {
        category = "Excluded";
        this.summary.Excluded += 1;
      } else if (!(await this.isValidExpense(amount, imageUrl))) {
        category = "Failed";
        this.summary.Failed += 1;
      } else {
        category = "Completed";
      }

      return { category, company, reportId, amount: parseFloat(amount) };
    } catch (error) {
      console.error("Error classifying expense:", error);
      return { category: "Failed", company: null, reportId: null, amount: 0 };
    }
  };

  isValidExpense = async (amount, imageUrl) => {
    try {
      const parsedAmount = parseFloat(amount);
      if (!parsedAmount || parsedAmount === 0) return false;

      const imageExists = await S3Service.isFileExistsInS3(
        process.env.AWS_BUCKET_IMAGES,
        imageUrl
      );
      return !!imageExists;
    } catch (error) {
      console.error("Error validating expense:", error);
      return false;
    }
  };

  saveExpensesBatch = async (batch) => {
    try {
      await Expense.insertMany(batch);

      for (const expense of batch) {
        const cacheKey = `expense:${expense.id}`;
        await redisConnection.set(
          cacheKey,
          JSON.stringify(expense),
          "EX",
          3600
        );
      }
    } catch (error) {
      console.error("Error saving expense batch:", error);
    }
  };
}

export default ExpenseWorker;
