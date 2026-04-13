import { Router } from "express";
import { verifyAuth } from "../middleware/verifyAuth";
import { createRateLimiter } from "../middleware/rateLimiter";
import {
  generateEmail,
  getHistory,
  deleteGeneration,
  sendEmail,
} from "../controllers/ai.controllers";

const router = Router();

const generateLimiter = createRateLimiter(20, 3600, "generate-email");

router.post("/generate-email", verifyAuth, generateLimiter, generateEmail);
router.get("/history", verifyAuth, getHistory);
router.delete("/history/:id", verifyAuth, deleteGeneration);
router.post("/send-email", verifyAuth, sendEmail);

export default router;
