import { createClient } from "redis";
import dotenv from "dotenv";
import logger from "./logger";

dotenv.config();

export const redisClient = createClient({
  url: process.env.REDIS_URL!,
});

export const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log("Connected to Redis successfully");
  } catch (error) {
    logger.error(`Failed to connect to Redis: ${error}`);
    process.exit(1); // Exit the process if Redis connection fails
  }
};
