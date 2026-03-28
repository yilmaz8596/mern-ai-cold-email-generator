import { Router } from "express";
import { verifyAuth } from "../middleware/verifyAuth";
import { generateEmail, getHistory, deleteGeneration } from "../controllers/ai.controllers";

const router = Router();

router.post("/generate-email", verifyAuth, generateEmail);
router.get("/history", verifyAuth, getHistory);
router.delete("/history/:id", verifyAuth, deleteGeneration);

export default router;
