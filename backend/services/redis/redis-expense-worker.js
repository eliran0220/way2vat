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
    this.reportUpdates = new Map();
    this.summary = { Completed: 0, Failed: 0, Excluded: 0, totalReports: 0 };
    this.reportsSet = new Set();
    this.saveTimeout = null;
    this.socketService = socketService;

    expenseQueue.processJobs(10, this.processExpense.bind(this));

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
        this.updateReport(reportUpdates, company, reportId, amount);
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
      if (this.batch.length > 0) {
        console.log("Saving batch size:", this.batch.length);
        await this.saveExpensesBatch(this.batch);
        console.log("Batch saved!");

        await this.updateExpenseSummary();

        this.batch = [];
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
  };

  isValidExpense = async (amount, imageUrl) => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount === 0) return false;

    const imageExists = await S3Service.isFileExistsInS3(
      process.env.AWS_BUCKET_IMAGES,
      imageUrl
    );
    return !!imageExists;
  };

  updateReport = (reportUpdates, company, reportId, amount) => {
    const reportKey = `${company}-${reportId}`;

    if (!reportUpdates.has(reportKey)) {
      reportUpdates.set(reportKey, {
        company,
        reportId,
        totalAmountCompleted: 0,
        expenseCount: 0,
      });
    }

    const report = reportUpdates.get(reportKey);
    report.totalAmountCompleted += amount;
    report.expenseCount += 1;
  };

  saveExpensesBatch = async (batch) => {
    await Expense.insertMany(batch);

    for (const expense of batch) {
      const cacheKey = `expense:${expense.id}`;
      await redisConnection.set(cacheKey, JSON.stringify(expense), "EX", 3600);
    }
  };
}

export default ExpenseWorker;
