import { Request, Response } from "express";
import logger from "../config/logger";
import User from "../models/user.model";
import { Generation } from "../models/generation.model";

interface AuthenticatedRequest extends Request {
  user?: { userId: string; email: string };
}

export const deleteAccount = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // delete generations and other user-owned data
    await Generation.deleteMany({ userId });

    // delete user
    await User.findByIdAndDelete(userId);

    // clear auth cookies if present
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return res.status(200).json({ message: "Account deleted" });
  } catch (error) {
    logger.error(
      `Failed to delete account: ${error instanceof Error ? error.message : String(error)}`,
    );
    return res.status(500).json({ message: "Failed to delete account" });
  }
};

export default { deleteAccount };
