import { Router } from "express";
import { verifyAuth } from "../middleware/verifyAuth";
import { verifyAdmin } from "../middleware/verifyAdmin";
import {
  getStats,
  getUsers,
  getTransactions,
  getRevenue,
} from "../controllers/admin.controllers";

const router = Router();

router.get("/stats", verifyAuth, verifyAdmin, getStats);
router.get("/users", verifyAuth, verifyAdmin, getUsers);
router.get("/transactions", verifyAuth, verifyAdmin, getTransactions);
router.get("/revenue", verifyAuth, verifyAdmin, getRevenue);

export default router;
