import Queue from "bull";


class RedisQueue {
    constructor(queueName, options = {}) {
        this.queue = new Queue(queueName, {
            redis: {
                host: process.env.REDIS_HOST || "redis",
                port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
            },
            ...options,
        });

        this.queue.on("error", (err) => console.error(`Queue error in ${queueName}:`, err));
    }

    addJob(jobData, options = {}) {
        return this.queue.add(jobData, options);
    }

    processJobs(concurrency, processFunction) {
        this.queue.process(concurrency, processFunction);
    }

    async closeQueue() {
        await this.queue.close();
    }
}

export const expenseQueue = new RedisQueue("expenseQueue");

export default RedisQueue;

