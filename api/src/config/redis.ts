import { createClient } from "redis";
import dotenv from "dotenv";
import logger from "./logger";

dotenv.config();

export const redisClient = process.env.REDIS_URL
  ? createClient({ url: process.env.REDIS_URL })
  : null;

export const connectRedis = async () => {
  try {
    if (!redisClient) {
      console.log("Redis disabled (no REDIS_URL)");
      return;
    }

    await redisClient.connect();
    console.log("Redis connected");
  } catch (error) {
    console.log("Redis failed but continuing:", error);
  }
};
