import { Router } from "express";
import { verifyAuth } from "../middleware/verifyAuth";
import {
  createCheckout,
  handleWebhook,
  getCredits,
  getTransactions,
} from "../controllers/billing.controllers";

const router = Router();

router.get("/credits", verifyAuth, getCredits);
router.get("/transactions", verifyAuth, getTransactions);
router.post("/checkout", verifyAuth, createCheckout);
router.post("/webhook", handleWebhook);

export default router;
