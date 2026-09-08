import { Router } from "express";
import {
  register,
  login,
  refresh,
  logout,
  sendOtpCode,
  verifyOtpCode,
  requestForgotPassword,
  submitResetPassword,
  getMe,
  completeMandiOnboardingHandler,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import {
  loginLimiter,
  otpLimiter,
  authLimiter,
} from "../middlewares/rateLimiter.middleware.js";

const router: Router = Router();

// Public Authentication Endpoints
router.post("/register", authLimiter, register);
router.post("/login", loginLimiter, login);
router.post("/refresh", refresh);
router.post("/logout", logout);

// OTP & Verification Endpoints
router.post("/send-otp", otpLimiter, sendOtpCode);
router.post("/verify-otp", verifyOtpCode);
router.post("/complete-mandi-onboarding", authLimiter, completeMandiOnboardingHandler);

// Password Recovery Endpoints
router.post("/forgot-password", otpLimiter, requestForgotPassword);
router.post("/reset-password", submitResetPassword);

// Protected User Session Endpoint
router.get("/me", authenticate, getMe);

export default router;

