import { Router } from "express";
import { verifyAuth } from "../middleware/verifyAuth";
import { generateEmail } from "../controllers/ai.controllers";

const router = Router();

router.post("/generate-email", verifyAuth, generateEmail);

export default router;
