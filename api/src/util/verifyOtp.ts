import bcrypt from "bcryptjs";
import { redisClient } from "../config/redis";
import logger from "../config/logger";

export const verifyOtp = async (
  email: string,
  otp: string,
): Promise<boolean> => {
  try {
    const otpKey = `otp:${email}`;
    const storedOtpHash = await redisClient.get(otpKey);

    if (!storedOtpHash) {
      logger.warn(`OTP verification failed: No OTP found for email=${email}`);
      return false; // OTP has expired or does not exist
    }

    const isValid = await bcrypt.compare(otp, storedOtpHash);
    if (!isValid) {
      logger.warn(`OTP verification failed: Invalid OTP for email=${email}`);
      return false; // Invalid OTP
    }

    return true;
  } catch (error) {
    logger.error(
      `Error verifying OTP for email=${email}: ${error instanceof Error ? error.message : String(error)}`,
    );
    return false;
  }
};
