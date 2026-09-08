import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("4000").transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  CLIENT_URL: z.string().default("http://localhost:3000"),
  DATABASE_URL: z.string().default("postgresql://postgres:postgres@localhost:5433/sih_db?schema=public"),
  JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET must be at least 16 chars").default("super-secret-access-token-key-change-in-prod-1234"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET must be at least 16 chars").default("super-secret-refresh-token-key-change-in-prod-5678"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("noreply@resend.dev"),
  IMAGEKIT_PUBLIC_KEY: z.string().default("public_DiSN/3jBr6w41xXQPGp2LHdAcxI="),
  IMAGEKIT_PRIVATE_KEY: z.string().default("private_UqO8ObeEL9BH77qUnJNEXyx9f4U="),
  IMAGEKIT_URL_ENDPOINT: z.string().default("https://ik.imagekit.io/frbjdpcvl"),
  GROQ_API_KEY: z.string().optional().default(""),
  GROQ_MODEL: z.string().default("llama-3.3-70b-versatile"),
  GROQ_TRANSCRIPTION_MODEL: z.string().default("whisper-large-v3-turbo"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables:", parsedEnv.error.format());
  // In development/test mode, provide defaults or warn
  if (process.env.NODE_ENV === "production") {
    throw new Error("Invalid environment variables");
  }
}

export const env = parsedEnv.success
  ? parsedEnv.data
  : {
      PORT: parseInt(process.env.PORT || "4000", 10),
      NODE_ENV: (process.env.NODE_ENV as "development" | "test" | "production") || "development",
      CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
      DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/sih_db?schema=public",
      JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "super-secret-access-token-key-change-in-prod-1234",
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "super-secret-refresh-token-key-change-in-prod-5678",
      JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
      JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      EMAIL_FROM: process.env.EMAIL_FROM || "noreply@resend.dev",
      IMAGEKIT_PUBLIC_KEY: process.env.IMAGEKIT_PUBLIC_KEY || "public_DiSN/3jBr6w41xXQPGp2LHdAcxI=",
      IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY || "private_UqO8ObeEL9BH77qUnJNEXyx9f4U=",
      IMAGEKIT_URL_ENDPOINT: process.env.IMAGEKIT_URL_ENDPOINT || "https://ik.imagekit.io/frbjdpcvl",
      GROQ_API_KEY: process.env.GROQ_API_KEY || "",
      GROQ_MODEL: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      GROQ_TRANSCRIPTION_MODEL: process.env.GROQ_TRANSCRIPTION_MODEL || "whisper-large-v3-turbo",
    };
