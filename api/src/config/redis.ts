import { createClient } from "redis";
import dotenv from "dotenv";
import logger from "./logger";

dotenv.config();

export const redisClient = process.env.REDIS_URL
  ? createClient({ url: process.env.REDIS_URL })
  : null;

export const connectRedis = async () => {
  try {
    if (redisClient !== null) {
      await redisClient.connect();
      logger.info("Connected to Redis successfully");
    } else {
      logger.info("Redis disabled (no REDIS_URL)");
    }
  } catch (error) {
    console.log("Redis failed but continuing:", error);
  }
};
