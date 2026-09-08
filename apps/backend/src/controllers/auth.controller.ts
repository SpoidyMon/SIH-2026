import { Request, Response, NextFunction } from "express";
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  sendOtp,
  verifyOtp,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  completeMandiOnboarding,
} from "../services/auth.service.js";
import {
  registerSchema,
  loginSchema,
  sendOtpSchema,
  verifyOtpSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  completeMandiOnboardingSchema,
} from "../schemas/auth.schema.js";

/**
 * Handle unified user registration (FARMER or MANDI_OPERATOR).
 */
export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validatedData = registerSchema.parse(req.body);
    const result = await registerUser(validatedData);
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle user login via email/phone & password.
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validatedData = loginSchema.parse(req.body);
    const result = await loginUser(validatedData);
    res.status(200).json({
      success: true,
      message: "Login successful.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle refresh token rotation.
 */
export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validatedData = refreshTokenSchema.parse(req.body);
    const result = await refreshAccessToken(validatedData.refreshToken);
    res.status(200).json({
      success: true,
      message: "Access token refreshed successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle user logout by revoking refresh token.
 */
export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const refreshToken = req.body?.refreshToken;
    const result = await logoutUser(refreshToken);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle sending/resending OTP codes.
 */
export async function sendOtpCode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validatedData = sendOtpSchema.parse(req.body);
    const result = await sendOtp(validatedData.identifier, validatedData.type);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle verifying OTP codes.
 */
export async function verifyOtpCode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validatedData = verifyOtpSchema.parse(req.body);
    const result = await verifyOtp(
      validatedData.identifier,
      validatedData.code,
      validatedData.type
    );
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle forgot-password requests.
 */
export async function requestForgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validatedData = forgotPasswordSchema.parse(req.body);
    const result = await forgotPassword(validatedData.email);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle resetting password with reset token or OTP.
 */
export async function submitResetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validatedData = resetPasswordSchema.parse(req.body);
    const result = await resetPassword(validatedData);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle fetching currently authenticated user profile.
 */
export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const user = await getCurrentUser(userId);
    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle completing Mandi Operator onboarding & issuing session tokens.
 */
export async function completeMandiOnboardingHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const validatedData = completeMandiOnboardingSchema.parse(req.body);
    const result = await completeMandiOnboarding(validatedData);
    res.status(200).json({
      success: true,
      message: "Mandi onboarding completed successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

