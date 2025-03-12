import Redis from "ioredis";

const redisConnection = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379");

redisConnection.on("connect", () => console.log("Connected to Redis"));
redisConnection.on("error", (err) => console.error("Redis error:", err));

export default redisConnection;
