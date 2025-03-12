import { expenseQueue } from "./redis/redis-queue.js";
import S3Service from "./aws/aws-service.js";
import csv from "csv-parser";

class Service {
    async processFile() {
        const fileStream = await S3Service.getFileFromS3(process.env.AWS_BUCKET_CSV, "expenses_new.csv");

        fileStream.pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
            .on("data", (expense) => {
                const formattedExpense = {
                    company: expense.Company,
                    reportId: expense.ReportId,
                    amount: expense.Amount,
                    imageUrl: expense.ImageUrl,
                    status: expense.Status,
                };
                
                console.log("Formatted job data:", formattedExpense);

                expenseQueue.addJob(formattedExpense, { removeOnComplete: true })
                    .then(() => console.log("Job added successfully:", formattedExpense))
                    .catch((err) => console.error("Failed to add job:", err));
            })
            .on("error", (error) => console.error("Stream error:", error))
            .on("end", () => console.log("File streaming completed, jobs added to queue."));

        return { message: "File processing started, jobs will be added asynchronously." };
    }
}

export default new Service();
