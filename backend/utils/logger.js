import pino from "pino";
import dotenv from "dotenv";

dotenv.config();

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: {
    target: "pino-pretty",
    options: { colorize: true },
  },
});

export default logger;
