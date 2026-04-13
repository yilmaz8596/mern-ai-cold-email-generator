import mongoose from "mongoose";
import logger from "./logger";

export const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.log("MongoDB disabled (no MONGO_URI)");
      return;
    }

    await mongoose.connect(process.env.MONGO_URI);
    logger.info("Connected to MongoDB successfully");
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error}`);
    console.log("Continuing without MongoDB...");
  }
};
