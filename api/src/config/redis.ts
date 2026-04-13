export interface RedisSafeClient {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, opts?: any) => Promise<any>;
  del: (key: string) => Promise<number>;
}

import { createClient } from "redis";
import logger from "./logger";

let realClient: any = null;

const fallback: RedisSafeClient = {
  get: async () => null,
  set: async () => "OK",
  del: async () => 0,
};

export const redisClient: RedisSafeClient = fallback;

export const connectRedis = async () => {
  const url = process.env.REDIS_URL;

  if (!url || url.trim() === "") {
    logger.info("Redis disabled (no REDIS_URL)");
    return;
  }

  try {
    realClient = createClient({ url });

    realClient.on("error", (err: any) => logger.error("Redis error: " + err));

    await realClient.connect();

    logger.info("Redis connected");

    // 🔥 swap implementation safely
    redisClient.get = realClient.get.bind(realClient);
    redisClient.set = realClient.set.bind(realClient);
    redisClient.del = realClient.del.bind(realClient);
  } catch (err) {
    logger.error("Redis failed, using fallback: " + err);
  }
};
