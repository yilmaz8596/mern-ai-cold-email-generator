import { Request, Response } from "express";
import { tryCatch } from "../util/tryCatch";
import User from "../models/user.model";
import logger from "../config/logger";
import bcrypt from "bcryptjs";
// Inline generateOtp to avoid cross-file resolution issues inside Docker build
import { randomInt } from "crypto";
const generateOtp = (length = 6): string => {
  if (length <= 0) return "";
  const max = 10 ** length;
  const n = randomInt(0, max);
  return n.toString().padStart(length, "0");
};
import { sendEmail } from "../util/sendEmail";
import { redisClient } from "../config/redis";
import { verifyOtp } from "../util/verifyOtp";
import { generateTokens, verifyRefreshToken } from "../util/generateTokens";

export const register = tryCatch(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Name, email, and password are required" });
  }
  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters long" });
  }
  if (!/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  const emailLower = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: emailLower });
  if (existingUser) {
    return res.status(400).json({ message: "Email is already registered" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({
    name,
    email: emailLower,
    password: hashedPassword,
    isVerified: false,
  });
  await user.save();

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);
  if (redisClient) {
    await redisClient?.setEx(`otp:${emailLower}`, 10 * 60, otpHash);
  }

  await sendEmail({
    to: emailLower,
    subject: "Your OTP for Mailify Registration",
    otp,
  });
  logger.info(`OTP sent for registration: email=${emailLower}`);

  res.status(201).json({
    message:
      "Registration successful. Check your email for the OTP to verify your account.",
  });
});

export const login = tryCatch(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const emailLower = email.toLowerCase().trim();
  const user = await User.findOne({ email: emailLower });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({ message: "Invalid password" });
  }

  if (!user.isVerified) {
    return res.status(403).json({
      message: "Email not verified. Please verify your account first.",
    });
  }

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);
  if (redisClient) {
    await redisClient?.setEx(`otp:${emailLower}`, 10 * 60, otpHash);
  }

  await sendEmail({
    to: emailLower,
    subject: "Your OTP for Mailify Login",
    otp,
  });
  logger.info(`OTP sent for login: email=${emailLower}`);

  res
    .status(200)
    .json({ message: "OTP sent. Check your email to complete login." });
});

export const refreshToken = tryCatch(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return res.status(401).json({ message: "Refresh token not found" });
  }

  let payload: { userId: string; email: string };
  try {
    payload = verifyRefreshToken(token);
  } catch {
    return res
      .status(401)
      .json({ message: "Invalid or expired refresh token" });
  }

  const stored = await redisClient?.get(`refresh:${payload.userId}`);
  if (!stored || stored !== token) {
    return res.status(401).json({ message: "Refresh token revoked" });
  }

  const { accessToken, refreshToken: newRefresh } = await generateTokens({
    userId: payload.userId,
    email: payload.email,
  });

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refreshToken", newRefresh, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  logger.info(`Token refreshed for userId=${payload.userId}`);
  res.status(200).json({ message: "Token refreshed successfully" });
});

export const logout = tryCatch(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      await redisClient?.del(`refresh:${payload.userId}`);
    } catch {}
  }
  // Clear both refresh and access tokens on logout
  res.clearCookie("refreshToken");
  res.clearCookie("accessToken");
  res.status(200).json({ message: "Logged out successfully" });
});

export const verifyOTP = tryCatch(async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  const emailLower = (email || "").toLowerCase().trim();
  const user = await User.findOne({ email: emailLower });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const isOtpVerified = await verifyOtp(emailLower, otp);
  if (!isOtpVerified) {
    return res.status(400).json({ message: "OTP has expired or is invalid" });
  }

  if (redisClient) {
    await redisClient?.del(`otp:${emailLower}`);
  }

  if (!user.isVerified) {
    user.isVerified = true;
    await user.save();
  }

  const { accessToken, refreshToken } = await generateTokens({
    userId: user._id.toString(),
    email: user.email,
  });

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  logger.info(`OTP verified and tokens issued: email=${emailLower}`);
  res.status(200).json({
    message: "OTP verified successfully",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    },
    credits: user.credits,
  });
});
