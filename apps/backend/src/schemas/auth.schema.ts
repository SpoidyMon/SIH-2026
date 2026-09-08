import { z } from "zod";

const passwordValidator = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[A-Za-z]/, "Password must contain at least one letter")
  .regex(/[0-9]/, "Password must contain at least one number");

const phoneValidator = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number (e.g. +919876543210 or 9876543210)")
  .optional()
  .or(z.literal("").transform(() => undefined));

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters long").max(100),
  email: z.string().trim().toLowerCase().email("Please provide a valid email address"),
  phone: phoneValidator,
  password: passwordValidator,
  role: z.enum(["FARMER", "MANDI_OPERATOR", "ADMIN"]).default("FARMER"),
  mandiName: z.string().trim().min(2).max(150).optional(),
});

export const roleRegisterSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters long").max(100),
  email: z.string().trim().toLowerCase().email("Please provide a valid email address"),
  phone: phoneValidator,
  password: passwordValidator,
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Email or phone number is required"),
  password: z.string().min(1, "Password is required"),
});

export const sendOtpSchema = z.object({
  identifier: z.string().trim().min(1, "Identifier (email or phone) is required"),
  type: z.enum(["EMAIL_VERIFICATION", "LOGIN_OTP", "PASSWORD_RESET"]).default("EMAIL_VERIFICATION"),
});

export const verifyOtpSchema = z.object({
  identifier: z.string().trim().min(1, "Identifier (email or phone) is required"),
  code: z.string().trim().length(6, "OTP must be exactly 6 digits").regex(/^\d+$/, "OTP must contain only numbers"),
  type: z.enum(["EMAIL_VERIFICATION", "LOGIN_OTP", "PASSWORD_RESET"]).default("EMAIL_VERIFICATION"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().trim().min(1, "Refresh token is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please provide a valid email address"),
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please provide a valid email address"),
  token: z.string().trim().min(1, "Reset token or OTP is required"),
  newPassword: passwordValidator,
});

export * from "../interfaces/index.js";
