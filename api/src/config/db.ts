import mongoose from "mongoose";
import dotenv from "dotenv";
import logger from "./logger";

dotenv.config();

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    logger.info("Connected to MongoDB successfully");
  } catch (error) {
    logger.error(`Failed to connect to MongoDB: ${error}`);
    process.exit(1); // Exit the process if MongoDB connection fails
  }
};
