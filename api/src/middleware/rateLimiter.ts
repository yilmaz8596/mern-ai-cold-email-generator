import { Request, Response, NextFunction } from "express";
import { redisClient } from "../config/redis";

export const createRateLimiter = (
  maxRequests: number,
  windowSeconds: number,
  keyPrefix: string,
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    const identifier = user?.userId ?? req.ip;
    const key = `ratelimit:${keyPrefix}:${identifier}`;

    try {
      let current: number | null = null;
      if (redisClient) {
        current = await redisClient?.incr(key);
      }
      if (current === 1 && redisClient) {
        await redisClient?.expire(key, windowSeconds);
      }

      if (current !== null && current !== undefined && current > maxRequests) {
        const ttl = redisClient ? await redisClient.ttl(key) : null;
        res.setHeader("Retry-After", String(ttl));
        return res.status(429).json({
          message: `Rate limit exceeded. Try again in ${Math.ceil(Number(ttl) / 60)} minute(s).`,
        });
      }
      next();
    } catch {
      next();
    }
  };
};
