import { Request, Response } from "express";
import bcrypt from "bcryptjs";
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

    await Generation.deleteMany({ userId });
    await User.findByIdAndDelete(userId);

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

export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { name } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      { name: name.trim() },
      { new: true },
    )
      .select("name email")
      .lean();

    if (!updated) return res.status(404).json({ message: "User not found" });

    return res.json({ name: updated.name, email: updated.email });
  } catch (error) {
    logger.error(
      `Update profile error: ${error instanceof Error ? error.message : String(error)}`,
    );
    return res.status(500).json({ message: "Failed to update profile" });
  }
};

export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Both passwords are required" });
    }
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(userId).select("password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(userId, { password: hashed });

    return res.json({ message: "Password updated successfully" });
  } catch (error) {
    logger.error(
      `Change password error: ${error instanceof Error ? error.message : String(error)}`,
    );
    return res.status(500).json({ message: "Failed to change password" });
  }
};
