import Queue from "bull";

class RedisQueue {
  constructor(queueName, options = {}) {
    this.queue = new Queue(queueName, {
      redis: {
        host: process.env.REDIS_HOST || "redis",
        port: process.env.REDIS_PORT
          ? parseInt(process.env.REDIS_PORT, 10)
          : 6379,
      },
      ...options,
    });

    this.queue.on("error", (err) =>
      console.error(`Queue error in ${queueName}:`, err)
    );
  }

  addJob = async (jobData, options = {}) => {
    try {
      return await this.queue.add(jobData, options);
    } catch (error) {
      console.error("Failed to add job to queue:", error);
      throw error;
    }
  };

  processJobs = (concurrency, processFunction) => {
    this.queue.process(concurrency, processFunction);
  };

  closeQueue = async () => {
    await this.queue.close();
  };
}

export const expenseQueue = new RedisQueue("expenseQueue");

export default RedisQueue;
