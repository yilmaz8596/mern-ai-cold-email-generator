import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import logger from "../config/logger";

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export const verifyAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const accessToken = req.cookies?.accessToken;

    if (!accessToken) {
      return res.status(401).json({ message: "Access token not found" });
    }

    const payload = jwt.verify(
      accessToken,
      process.env.JWT_ACCESS_TOKEN_SECRET!,
    ) as {
      userId: string;
      email: string;
    };

    if (!payload || !payload.userId) {
      return res.status(401).json({ message: "Invalid access token" });
    }

    req.user = payload;
    next();
  } catch (error) {
    logger.error(
      `Authentication error: ${error instanceof Error ? error.message : String(error)}`,
    );
    return res.status(401).json({ message: "Unauthorized" });
  }
};
