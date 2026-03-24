import { Request, Response, NextFunction } from "express";
import logger from "../config/logger";

export const tryCatch = (fn: Function) => {
  try {
    return async (req: Request, res: Response, next: NextFunction) => {
      await fn(req, res, next);
    };
  } catch (error) {
    logger.error(
      `Error in ${fn.name}: ${error instanceof Error ? error.message : String(error)}`,
    );
    throw error;
  }
};
