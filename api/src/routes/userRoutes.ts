import { Router } from "express";
import { deleteAccount } from "../controllers/user.controllers";
import { verifyAuth } from "../middleware/verifyAuth";

const router = Router();

// Delete current user's account
router.delete("/me", verifyAuth, deleteAccount);

export default router;
