import { Router } from "express";
import {
  deleteAccount,
  updateProfile,
  changePassword,
} from "../controllers/user.controllers";
import { verifyAuth } from "../middleware/verifyAuth";

const router = Router();

router.patch("/me", verifyAuth, updateProfile);
router.post("/change-password", verifyAuth, changePassword);
router.delete("/me", verifyAuth, deleteAccount);

export default router;
