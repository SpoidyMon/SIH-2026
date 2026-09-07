export type UserRole = "FARMER" | "MANDI_OPERATOR" | "ADMIN";

export interface UserSession {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  isVerified: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponseData {
  user: UserSession;
  accessToken: string;
  refreshToken: string;
  message?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  code?: string;
  errors?: Array<{ field: string; message: string }>;
}

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface RegisterMandiPayload {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: "MANDI_OPERATOR";
}

export interface VerifyOtpPayload {
  identifier: string;
  code: string;
  type: "EMAIL_VERIFICATION" | "LOGIN_OTP" | "PASSWORD_RESET";
}

export interface SendOtpPayload {
  identifier: string;
  type: "EMAIL_VERIFICATION" | "LOGIN_OTP" | "PASSWORD_RESET";
}
