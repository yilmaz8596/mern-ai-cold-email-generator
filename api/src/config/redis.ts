import { createClient } from "redis";
import dotenv from "dotenv";
import logger from "./logger";

dotenv.config();

export const redisClient = createClient({
  url: process.env.REDIS_URL!,
});

export const connectRedis = async () => {
  try {
    if (!process.env.REDIS_URL) {
      console.log("Redis disabled (no REDIS_URL provided)");
      return;
    }

    await redisClient.connect();
    console.log("Connected to Redis successfully");
  } catch (error) {
    logger.error(`Redis connection failed: ${error}`);
    console.log("Continuing without Redis...");
  }
};
