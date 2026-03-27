import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import mongoSanitize from "express-mongo-sanitize";
import cookiParser from "cookie-parser";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import aiRoutes from "./routes/aiRoutes";
import billingRoutes from "./routes/billingRoutes";
import logger from "./config/logger";
import { connectRedis } from "./config/redis";
import { connectDB } from "./config/db";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN!,
  }),
);

app.use("/api/billing/webhook", express.raw({ type: "application/json" }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookiParser());
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
app.use("/api/billing", billingRoutes);
async function startServer() {
  try {
    await connectRedis();
    await connectDB();
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error}`);
    process.exit(1); // Exit the process if server fails to start
  }
}

startServer();
