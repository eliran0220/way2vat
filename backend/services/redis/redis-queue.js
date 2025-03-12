import Queue from "bull";
import redisConnection from "./redis-connection.js";

class RedisQueue {
    constructor(queueName, options = {}) {
        this.queue = new Queue(queueName, {
            connection: redisConnection,
            ...options,
        });

        this.queue.on("error", (err) => console.error(`❌ Queue error in ${queueName}:`, err));
    }

    addJob(jobData, options = {}) {
        return this.queue.add(jobData, options);
    }

    processJobs(processFunction) {
        this.queue.process(processFunction);
    }

    async closeQueue() {
        await this.queue.close();
    }
}

export const expenseQueue = new RedisQueue("expenseQueue");

export default RedisQueue;
