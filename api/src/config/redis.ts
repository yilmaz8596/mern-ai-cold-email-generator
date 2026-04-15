import { createClient } from "redis";
import logger from "./logger";

export let redisClient: ReturnType<typeof createClient> | null = null;

if (process.env.REDIS_URL) {
  redisClient = createClient({
    url: process.env.REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => Math.min(retries * 50, 1000),
    },
  });

  redisClient.on("error", (err) => {
    logger.error("Redis error (non-fatal):", err);
  });
}

export const connectRedis = async () => {
  if (!redisClient) {
    logger.warn("Redis disabled");
    return;
  }

  try {
    await redisClient.connect();
    logger.info("Redis connected");
  } catch (err) {
    logger.warn("Redis failed, continuing...");
  }
};
