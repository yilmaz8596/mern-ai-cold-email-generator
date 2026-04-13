import { Request, Response, NextFunction } from "express";
import User from "../models/user.model";

export const verifyAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = (req as any).user;
    if (!user?.userId) return res.status(401).json({ message: "Unauthorized" });

    const dbUser = await User.findById(user.userId).select("isAdmin").lean();
    if (!dbUser?.isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};
