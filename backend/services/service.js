import { expenseQueue } from "./redis/redis-queue.js"
import S3Service from "./aws/aws-service.js";
import csv from "csv-parser";

class Service {
    async processFile() {
        const fileStream = await S3Service.getFileFromS3(process.env.AWS_BUCKET_CSV, "expenses_new.csv");

        return new Promise((resolve, reject) => {
            fileStream
                .pipe(csv({ headers: true }))
                .on("data", (expense) => {
                    expenseQueue.addJob(expense, { removeOnComplete: true })
                        .catch((err) => {
                            console.error("Failed to add job:", err);
                            reject(err);
                        });
                })
                .on("end", () => {
                    resolve({ message: "File streaming completed, jobs added to queue." });
                })
                .on("error", (error) => reject(error));
        });
    }
}

export default new Service();
