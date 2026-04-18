import { Request, Response, NextFunction } from "express";
import logger from "../config/logger";

export const tryCatch = (fn: Function) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      logger.error(
        `Error in ${fn.name}: ${error instanceof Error ? error.message : String(error)}`,
      );
      // Respond with a generic 500 so clients get a proper error
      try {
        if (!res.headersSent) {
          res.status(500).json({ message: "Internal Server Error" });
        }
      } catch (e) {
        // ignore
      }
      // Do not rethrow — this is the top-level handler for route errors
    }
  };
};
