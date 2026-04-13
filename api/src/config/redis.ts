import { createClient } from "redis";
import dotenv from "dotenv";
import logger from "./logger";

dotenv.config();

export const redisClient = process.env.REDIS_URL
  ? createClient({ url: process.env.REDIS_URL })
  : null;

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
