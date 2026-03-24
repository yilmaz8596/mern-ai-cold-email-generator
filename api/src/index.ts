import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import mongoose from "mongoose";
import mongoSanitize from "express-mongo-sanitize";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import aiRoutes from "./routes/aiRoutes";
import logger from "./config/logger";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN!,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan("combined"));
// Workaround for Express 5: `req.query` can be a getter-only property.
// `express-mongo-sanitize` mutates `req.query` which causes a TypeError when
// the property is not writable. Create a writable shallow copy of `req.query`
// and attach it to the request before running the sanitizer.
app.use(
  (
    req: express.Request,
    _res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const q = { ...req.query } as Record<string, any>;
      Object.defineProperty(req, "query", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: q,
      });
    } catch (err) {
      // If overriding fails, continue without the workaround.
    }
    next();
  },
);

app.use(mongoSanitize());

app.get("/health", (req, res) => {
  res.send("API is healthy");
});

app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);

mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => {
    logger.info("Connected to MongoDB");
  })
  .catch((error) => {
    logger.error("Error connecting to MongoDB:", error);
    process.exit(1);
  });

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
