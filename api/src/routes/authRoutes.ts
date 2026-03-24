import { Router } from "express";
import {
  register,
  login,
  logout,
  refreshToken,
  verifyOTP,
} from "../controllers/auth.controllers";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);
router.post("/verify-otp", verifyOTP);

export default router;
