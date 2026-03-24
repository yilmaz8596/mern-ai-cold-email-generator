import { Request, Response } from "express";
import { tryCatch } from "../util/tryCatch";
import User from "../models/user.model";
import logger from "../config/logger";
import bcrypt from "bcryptjs";
import { generateOTP } from "../util/generateOTP";
import { sendEmail } from "../util/sendEmail";

export const register = tryCatch(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  logger.info(`Register handler called for email=${email}`);

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
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "Email is already registered" });
  }

  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

  await sendEmail({
    to: email,
    subject: "Your OTP for AI Cold Email Generator",
    otp,
  });

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({
    name,
    email,
    password: hashedPassword,
    otp,
    otpExpires,
  });
  await user.save();

  logger.info(`User registered successfully: email=${email}`);
  res.status(201).json({ message: "User registered successfully" });
});

export const login = tryCatch(async (req: Request, res: Response) => {});

export const refreshToken = tryCatch(async (req: Request, res: Response) => {});

export const logout = tryCatch(async (req: Request, res: Response) => {});

export const verifyOTP = tryCatch(async (req: Request, res: Response) => {});
