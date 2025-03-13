import { expenseQueue } from "../redis/redis-queue.js";
import S3Service from "../aws/aws-service.js";
import csv from "csv-parser";
import redisConnection from "../redis/redis-connection.js";
import Expense from "../../database/models/expense.js";
import mongoose from "mongoose";

class Service {
  processFile = async () => {
    try {
      const fileStream = await S3Service.getFileFromS3(
        process.env.AWS_BUCKET_CSV,
        "expenses_new.csv"
      );

      return new Promise((resolve, reject) => {
        fileStream
          .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
          .on("data", async (expense) => {
            try {
              const formattedExpense = {
                company: expense.Company,
                reportId: expense.ReportId,
                amount: expense.Amount,
                imageUrl: expense.ImageUrl,
                status: expense.Status,
              };

              console.log("Formatted job data:", formattedExpense);

              await expenseQueue.addJob(formattedExpense, {
                removeOnComplete: true,
              });
              console.log("Job added successfully:", formattedExpense);
            } catch (err) {
              console.error("Failed to add job:", err);
            }
          })
          .on("error", (error) => {
            console.error("Stream error:", error);
            reject(error);
          })
          .on("end", () => {
            console.log("File streaming completed, jobs added to queue.");
            resolve({
              message:
                "File processing started, jobs will be added asynchronously.",
            });
          });
      });
    } catch (error) {
      console.error("Error processing file:", error);
      throw new Error("Failed to process file");
    }
  };

  getExpenseById = async (expenseId) => {
    const cacheKey = `expense:${expenseId}`;

    try {
      const cachedExpense = await redisConnection.get(cacheKey);
      if (cachedExpense) {
        console.log("Found in cache!");
        return JSON.parse(cachedExpense);
      }

      if (!mongoose.Types.ObjectId.isValid(expenseId)) {
        throw new Error("Invalid expense ID format");
      }

      const _id = new mongoose.Types.ObjectId(expenseId);
      const expense = await Expense.findById(_id);

      if (!expense) {
        return null;
      }

      await redisConnection.set(cacheKey, JSON.stringify(expense), "EX", 3600);
      return expense;
    } catch (error) {
      console.error("Error retrieving expense:", error);
      throw error;
    }
  };

  getSummary = async () => {
    try {
      const cachedSummary = await redisConnection.get("summary:data");

      if (cachedSummary) {
        console.log("Returning cached summary");
        return JSON.parse(cachedSummary);
      }

      console.log("Cache miss, querying MongoDB");
      const summary = await ExpenseSummary.findOne({}).lean();

      if (!summary) {
        return { message: "No summary data available yet" };
      }

      await redisConnection.set(
        "summary:data",
        JSON.stringify(summary),
        "EX",
        60
      );

      return summary;
    } catch (error) {
      console.error("Error retrieving summary:", error);
      throw error;
    }
  };
}

export default new Service();
